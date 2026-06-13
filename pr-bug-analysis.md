# PR #1 Bug Analysis — feature/unblock-posts-and-resume

9 findings: 1 SECURITY, 5 BUG, 3 CLEANUP (one BUG and one CLEANUP share a file+fix).

---

## [1] SSRF via unrestricted server-side URL fetch
**File:** `src/app/api/jobs/fetch-description/route.ts:45`
**Severity:** SECURITY

### Root Cause
The only validation on line 45 is `!url.startsWith('http')`. This passes for any http/https URL including:
- `http://169.254.169.254/latest/meta-data/iam/security-credentials/` (AWS IMDSv1 — returns instance role credentials in plaintext)
- `http://localhost:5432/` or `http://10.0.0.x/` (internal VPC services)
- `http://[::1]/` (IPv6 loopback bypasses naive string checks)

The server then fetches the URL and returns up to 8 000 characters of the response body to the caller as `description`. An attacker who controls the `url` POST field gets an authenticated read proxy into the server's network.

### Fix
Add an allowlist of known job-board hostnames before the `fetch`. If the URL's hostname is not on the list, return 400.

```ts
// after parsing url, before fetch:
const ALLOWED_HOSTS = new Set([
  'lever.co', 'jobs.lever.co',
  'greenhouse.io', 'boards.greenhouse.io',
  'linkedin.com', 'www.linkedin.com',
  'indeed.com', 'www.indeed.com',
  'ziprecruiter.com', 'www.ziprecruiter.com',
  'wellfound.com',
  'workday.com',
])

let parsed: URL
try { parsed = new URL(url) } catch {
  return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
}

const hostname = parsed.hostname.replace(/^www\./, '')
if (!ALLOWED_HOSTS.has(parsed.hostname) && !ALLOWED_HOSTS.has(hostname)) {
  return NextResponse.json({ error: 'URL host not permitted' }, { status: 400 })
}
```

### Watch out for
- The allowlist must match both `www.greenhouse.io` and `boards.greenhouse.io` style subdomains — check all entry points for each board.
- Reject non-http(s) schemes explicitly (`file://`, `data:`, etc.) — `new URL()` accepts them.
- If you later allow arbitrary employer career sites, you need IP-level SSRF protection (resolve hostname → check against RFC 1918 / link-local ranges before fetching).

---

## [2] Null crash when Regenerate fires in news mode with no digest selected
**File:** `src/app/(dashboard)/posts/page.tsx:62`
**Severity:** BUG

### Root Cause
`generateBody()` at line 62 uses `selectedDigest!.content` and `selectedDigest!.date` — non-null assertions. `callGenerate` is passed directly as `onRegenerate` to `<PostVariants>` (line 210). `PostVariants` calls `onRegenerate` without checking `canGenerate`. If the user:
1. Is in `'news'` mode, selects a digest, and generates a post (so `currentDraft` is set and `<PostVariants>` renders).
2. Clicks the same digest row again (toggles `selectedDigest` back to `null` at line 150).
3. Clicks Regenerate inside `<PostVariants>`.

`callGenerate` executes, `generateBody()` is called, `selectedDigest` is `null`, and `selectedDigest!.content` throws a `TypeError` at runtime.

### Fix
Add a guard at the top of `callGenerate` (line 66):

```ts
const callGenerate = async () => {
  if (!canGenerate) return   // ← add this line
  setDrafting(true)
  ...
```

`canGenerate` at line 64 is already `!!selectedDigest` for news mode, so this is the single correct gate.

### Watch out for
- The Generate button (line 194) already gates on `canGenerate`, so this change makes Regenerate consistent with it — no UI drift.
- Confirm `PostVariants` component receives and calls `onRegenerate` directly (no internal guard) — that is where the bypass originates.

---

## [3] Regenerate bypasses canGenerate check in custom mode too
**File:** `src/app/(dashboard)/posts/page.tsx:64`
**Severity:** BUG

### Root Cause
Same `callGenerate` / `onRegenerate` bypass as finding [2], but in custom mode. Steps to reproduce:
1. Paste content into the textarea, generate a post — `currentDraft` renders `<PostVariants>`.
2. Clear the textarea — `customContent` becomes `''`, `canGenerate` becomes `false`.
3. Click Regenerate inside `<PostVariants>`.

`callGenerate` fires, `generateBody()` returns `{ customContent: '', topic: 'Custom' }`, the API receives an empty body and returns a 400. The error state (`draftError`) is set — but only because the route explicitly rejects it. If the route were lenient, Claude would receive an empty prompt.

### Fix
Identical to [2] — the `if (!canGenerate) return` guard at the top of `callGenerate` covers both modes simultaneously. No separate fix needed once [2] is applied.

### Watch out for
- Test both modes after the fix: generate → clear → attempt regenerate → confirm no API call fires.

---

## [4] Unawaited delete races the Promise.all reads
**File:** `src/app/(dashboard)/home/page.tsx:12`
**Severity:** BUG

### Root Cause
Line 12:
```ts
supabase.from('digests').delete().eq('user_id', user.id).lt('date', cutoff.toISOString().split('T')[0])
```
This is fire-and-forget. The `Promise.all` on line 14 starts immediately. If the delete is still in-flight when the reads execute, Postgres may return rows that are simultaneously being deleted, leading to inconsistent UI data near the 5-day cutoff boundary. Crucially, any error (RLS violation, connection drop, constraint failure) is silently discarded — the page renders as if cleanup succeeded even when it did not.

### Fix
Await the delete and surface errors:

```ts
const { error: cleanupError } = await supabase
  .from('digests')
  .delete()
  .eq('user_id', user.id)
  .lt('date', cutoff.toISOString().split('T')[0])

if (cleanupError) console.error('digest cleanup failed:', cleanupError.message)
```

Long-term: move this to a Supabase scheduled function or a pg_cron job so it does not run on every page load and does not race with reads.

### Watch out for
- The page is a Server Component, so `await` works fine here — no async boundary issues.
- Ensure `cutoff` date formatting matches the `date` column type (text `YYYY-MM-DD` or actual `date`). The current `.split('T')[0]` is correct if the column is `date` or `timestamptz`.

---

## [5] poll() swallows network errors — silent infinite retry
**File:** `src/components/jobs/ResumePipelineStatus.tsx:45`
**Severity:** BUG

### Root Cause
`poll()` (lines 45–50) has no try/catch. `fetch()` throws on network failure (connection refused, DNS timeout, etc.) — it does not just return a non-ok response. Without a catch, the thrown error becomes an unhandled promise rejection. The `setInterval` at line 35 continues firing every 3 seconds indefinitely. The component never transitions away from the spinner state, and the user has no feedback that anything is wrong.

### Fix
```ts
async function poll() {
  if (!requestId) return
  try {
    const res = await fetch(`/api/jobs/resume-request?id=${requestId}`)
    const data: PollResponse = await res.json()
    if (data.request) setReq(data.request)
  } catch {
    // network error — interval will retry; leave status unchanged
  }
}
```

Optionally track a consecutive-error counter and set `req.status = 'failed'` after N retries to give the user a recoverable state.

### Watch out for
- `res.json()` also throws if the response body is not valid JSON (e.g., 502 from a proxy returning HTML). Wrap or check `res.ok` before calling `.json()`.
- The cleanup in `useEffect` already clears the interval on unmount and on terminal status — that logic is correct and must not be touched.

---

## [6] checkVisaWarning misses common blocking phrasings
**File:** `src/lib/resume.ts:265`
**Severity:** BUG

### Root Cause
The 8 existing patterns cover standard phrasing but miss real-world variants encountered in job postings. False negatives here directly harm the user — the UI shows no warning on a job that is actually closed to visa holders.

Missing patterns (with examples):
- "Only US nationals may apply" — no pattern covers `nationals.*only`
- "Candidates must have permanent work authorization" — not matched by the current `must be authorized` pattern (which requires "without sponsorship" in the same clause)
- "We cannot support work visa transfers" — not matched
- "No sponsorship will be considered" — close to existing `sponsorship.*not` but the word order `no.*sponsorship.*considered` is not covered
- "Must have unrestricted right to work" — not matched

### Fix
Add to the `patterns` array in `checkVisaWarning`:

```ts
[/permanent\s+(work\s+)?authorization/i, 'Permanent work authorization required'],
[/unrestricted\s+(right\s+to\s+work|work\s+authorization)/i, 'Unrestricted work authorization required'],
[/us\s+nationals?\s+only/i, 'US nationals only'],
[/no\s+sponsorship\s+will\s+be\s+(provided|considered|available|offered)/i, 'No sponsorship considered'],
[/cannot\s+(support|provide|offer)\s+(work\s+)?visa/i, 'Cannot support visa'],
```

### Watch out for
- Test against real job descriptions before shipping — overly broad patterns like `/permanent/i` alone would false-positive on "permanent remote position".
- The function is called in `src/lib/resume.ts` (resume generation) and probably also in `extractAtsKeywords` pipeline — check all call sites so the improved detection flows through everywhere.

---

## [7] Duplicate TECH_VOCAB entries displace keywords from top-15 result
**File:** `src/lib/jobs.ts:98,108` (Solidity) and `101,114` (Redis)
**Severity:** BUG

### Root Cause
`TECH_VOCAB` at line 96 contains:
- `'Solidity'` at index ~12 (line 98) and again at index ~25 (line 108, start of Web3 block)
- `'Redis'` at index ~18 (line 101) and again at index ~43 (line 114)

`extractAtsKeywords` deduplicates via `!found.includes(kw)` (line 123), so the second occurrence never adds a duplicate to `found`. However, the loop still iterates over the duplicate entry and runs a regex match — wasted work on every call.

The real harm: `found.slice(0, 15)` caps the result at 15 keywords. If a job description matches 16+ unique keywords from `TECH_VOCAB`, the iteration order matters. The duplicate Solidity/Redis entries occupy two slots in the vocabulary array that could have been two distinct keywords earlier in the list. Any unique keyword that would have appeared between those positions gets evaluated but may not reach the top-15 window if 15 unique hits are found before the list is exhausted. This silently skews ATS scores and the resume skill selection.

### Fix
Remove the duplicate entries:

In `TECH_VOCAB`, line 108 — remove `'Solidity',` (keep it on line 98 with the languages block, and keep the rest of the Web3 block starting with `'Web3.js'`).

Line 114 — remove the trailing `'Redis',` (it's already in the databases block on line 101).

```ts
// Line 108 — change from:
'Solidity', 'Web3.js', 'Ethereum', ...
// to:
'Web3.js', 'Ethereum', ...

// Line 114 — change from:
'SQLAlchemy', 'Prisma', 'Redis', 'Celery', 'Nginx', 'Linux',
// to:
'SQLAlchemy', 'Prisma', 'Celery', 'Nginx', 'Linux',
```

### Watch out for
- The order of remaining entries determines which keywords beat the 15-slot cap. After removing duplicates, verify the order groups related tech together (languages → frameworks → DBs → cloud → AI → Web3 → tooling).
- No test suite exists; manually verify `extractAtsKeywords` against a sample JD mentioning both Solidity and Redis to confirm correct deduplication still works.

---

## [8] handleRequestGenerate and handleSearchRequestGenerate are near-identical
**File:** `src/app/(dashboard)/jobs/page.tsx:113,142`
**Severity:** CLEANUP

### Root Cause
`handleRequestGenerate` (line 113) and `handleSearchRequestGenerate` (line 142) share identical structure: set loading state, set `requestJobMeta`, POST to `/api/jobs/resume-request` with `{job_title, company, job_description, template}`, set `requestId` on success, catch + log on error, clear loading in finally. The only difference is the data source (explicit params vs `selectedJob` fields).

Any change to the request payload, headers, or error handling must be applied identically in two places.

### Fix
Extract a single `submitResumeRequest` function:

```ts
async function submitResumeRequest(company: string, title: string, description: string, template: ResumeTemplate) {
  setRequestLoading(true)
  setRequestJobMeta({ title, company, description })
  try {
    const res = await fetch('/api/jobs/resume-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_title: title, company, job_description: description, template }),
    })
    const data = await res.json()
    if (data.request) setRequestId(data.request.id)
  } catch (e) { console.error(e) } finally { setRequestLoading(false) }
}

// Replace handleRequestGenerate:
async function handleRequestGenerate(company: string, title: string, description: string, template: ResumeTemplate) {
  await submitResumeRequest(company, title, description, template)
}

// Replace handleSearchRequestGenerate:
async function handleSearchRequestGenerate(template: ResumeTemplate) {
  if (!selectedJob) return
  await submitResumeRequest(selectedJob.company, selectedJob.title, selectedJob.description, template)
}
```

### Watch out for
- Verify both call sites pass `template` typed as `ResumeTemplate` (the manual path currently passes `string` from `handleManualGenerate` — check `ManualJobInput`'s callback signature).

---

## [9] openDigestId and selectedDigest are redundant state kept in sync manually
**File:** `src/app/(dashboard)/posts/page.tsx:27-28`
**Severity:** CLEANUP

### Root Cause
`openDigestId` (line 28) and `selectedDigest` (line 27) are both set in the same click handler (lines 150–151). They are always updated together, but their semantic roles differ: `openDigestId` controls accordion expand/collapse; `selectedDigest` is the content used for generation. Because they are kept in sync manually, any future handler that only updates one (e.g. a "collapse all" button, or a "clear selection" action) will leave the other stale — `generateBody()` would then POST outdated content.

Additionally, `fetchDigests` (line 49) sets `openDigestId` on load but never sets `selectedDigest`, which is the correct default (no digest selected). This is fine now but is a subtle asymmetry that can confuse future maintainers.

### Fix
Keep `openDigestId` for accordion UI state. Derive `selectedDigest` from it:

```ts
const selectedDigest = openDigestId ? digests.find((d) => d.id === openDigestId) ?? null : null
```

Remove the `selectedDigest` `useState` declaration. Update the click handler:

```ts
onClick={() => {
  setOpenDigestId(isOpen ? null : digest.id)
}}
```

Replace all `selectedDigest?.id === digest.id` checks with `openDigestId === digest.id`.

**Note:** With this approach, selecting a digest and expanding it become the same action (clicking a row selects AND expands it). If the design intent is that a user can expand a digest to preview it without selecting it, then the two states are genuinely independent and this refactor does not apply — keep them separate but document the invariant.

### Watch out for
- The "Use this digest →" button inside the expanded row (line 175) currently calls `setSelectedDigest(digest)` without changing `openDigestId`. Under the derived approach, clicking this button would need to call `setOpenDigestId(digest.id)` instead.
- `activeContent` (line 57) uses `selectedDigest?.content` — update to use the derived value.
