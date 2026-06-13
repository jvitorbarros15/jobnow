# PR Fix Plan — feature/unblock-posts-and-resume

## Validation Summary

**[1] SSRF via unrestricted server-side URL fetch — VALID**
Confirmed: `src/app/api/jobs/fetch-description/route.ts` line 45 only checks `!url.startsWith('http')`. Any http/https URL including internal metadata endpoints passes. The proposed allowlist fix is correct. One addition needed: explicitly reject non-http(s) schemes after `new URL()` parsing (the analysis mentions this in "Watch out for" but doesn't include it in the fix code — the `new URL()` check alone doesn't block `javascript:`, `file://`, etc.).

**[2] Null crash when Regenerate fires in news mode with no digest selected — VALID**
Confirmed: `callGenerate` at line 66 has no `canGenerate` guard. `PostVariants.tsx` line 33–35 calls `onRegenerate()` directly with no precondition. The crash path is real and reachable in exactly the steps described.

**[3] Regenerate bypasses canGenerate in custom mode — VALID**
Confirmed as the same root cause. The single `if (!canGenerate) return` guard in `callGenerate` covers both modes. No separate fix needed.

**[4] Unawaited delete races the Promise.all reads — VALID**
Confirmed: `home/page.tsx` line 12 is fire-and-forget (no `await`, return value discarded). The race and silent-error-swallow are real. Fix is correct; the page is a Server Component so `await` works fine.

**[5] poll() swallows network errors — silent infinite retry — VALID, NEEDS ADJUSTMENT**
Confirmed: `ResumePipelineStatus.tsx` lines 45–50 have no try/catch. However the analysis missed a second throw site: `res.json()` on line 48 will also throw if the server returns non-JSON (e.g. 502 HTML from proxy). The fix must wrap both `fetch()` and `res.json()` — just wrapping `fetch()` leaves the second throw path unhandled. The proposed fix code does wrap both (the catch covers the entire try block), so the code itself is fine. The analysis text says "wrap or check `res.ok` before calling `.json()`" but the fix snippet doesn't add an `res.ok` check — should also surface HTTP errors explicitly rather than silently ignoring a 500 response that returns valid JSON with no `request` field.

**[6] checkVisaWarning misses common blocking phrasings — VALID**
Confirmed: `src/lib/resume.ts` lines 266–275 contain exactly 8 patterns. All 5 missing variants listed are genuine false negatives against real job posting language. Patterns are appropriately scoped (not overly broad). The warning about `checkVisaWarning` being called from other places: it is only defined here and exported — check call sites before shipping. The fix is sound.

**[7] Duplicate TECH_VOCAB entries — VALID, SEVERITY OVERSTATED**
Confirmed: `src/lib/jobs.ts` line 98 has `'Solidity'` and line 108 has `'Solidity'` again; line 101 has `'Redis'` and line 114 has `'Redis'` again. The deduplication via `!found.includes(kw)` on line 123 means no duplicate ever enters `found[]`. The claim that duplicates "displace keywords from the top-15 window" is theoretically true but requires exactly 15+ unique matches AND the displaced keyword appearing between the two occurrences of the duplicate in the array — a narrow edge case for most real JDs. Real harm is wasted regex iterations. Severity should be CLEANUP, not BUG. Fix is correct: remove the second occurrence of each.

**[8] handleRequestGenerate and handleSearchRequestGenerate are near-identical — VALID, NEEDS ADJUSTMENT**
Confirmed: both functions at lines 113 and 142 are structurally identical. However the analysis missed a type mismatch: `ManualJobInput`'s `onRequestGenerate` prop is typed as `(company, title, description, template: string) => void` (line 9 of `ManualJobInput.tsx`) — `template` is `string`, not `ResumeTemplate`. But `handleRequestGenerate` in `jobs/page.tsx` is declared as `template: string` (line 113) while `handleSearchRequestGenerate` takes `template: ResumeTemplate` (line 142). The proposed unified `submitResumeRequest` takes `template: ResumeTemplate`. This would break the `ManualJobInput` call site unless `ManualJobInput.tsx`'s prop type is also updated to `ResumeTemplate`. Include that in the fix.

**[9] openDigestId and selectedDigest are redundant — VALID, with design caveat noted**
Confirmed: both are set together in the same click handler (lines 149–151). The analysis correctly identifies the risk. However, the "Use this digest →" button at line 175 calls `setSelectedDigest(digest)` without toggling `openDigestId` — so under the current code, a user CAN select a digest without it being "open" (via this button). That means the two states are already not always in sync, which actually strengthens the case for the derived approach. The fix must also update the "Use this digest →" button to call `setOpenDigestId(digest.id)` instead.

---

## Fix Order

1. **[1] SSRF** — no dependencies; security issue, fix first
2. **[4] Unawaited delete** — no dependencies; data integrity issue
3. **[2+3] canGenerate guard** — single change covers both findings
4. **[5] poll() error handling** — no dependencies
5. **[6] checkVisaWarning patterns** — no dependencies
6. **[7] TECH_VOCAB duplicates** — no dependencies
7. **[8] Deduplicate handler functions** — depends on nothing but touches type boundary between ManualJobInput and jobs/page
8. **[9] Derive selectedDigest** — most UI surface area; do last

---

## Implementation Steps

### Step 1: Block SSRF in fetch-description route
**Files to change:** `src/app/api/jobs/fetch-description/route.ts`

**What to do:** Replace lines 43–47 with URL parsing + allowlist check:

```ts
const { url } = await request.json() as { url: string }

let parsed: URL
try { parsed = new URL(url) } catch {
  return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
}
if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
  return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
}

const ALLOWED_HOSTS = new Set([
  'lever.co', 'jobs.lever.co',
  'greenhouse.io', 'boards.greenhouse.io',
  'linkedin.com', 'www.linkedin.com',
  'indeed.com', 'www.indeed.com',
  'ziprecruiter.com', 'www.ziprecruiter.com',
  'wellfound.com', 'angel.co',
  'workday.com', 'myworkdayjobs.com',
  'careers.google.com', 'jobs.ashbyhq.com',
])
const ALLOWED_SUFFIXES = [
  '.myworkdayjobs.com',
  '.greenhouse.io',
  '.lever.co',
  '.ashbyhq.com',
]
const hostname = parsed.hostname
const stripped = hostname.replace(/^www\./, '')
if (
  !ALLOWED_HOSTS.has(hostname) &&
  !ALLOWED_HOSTS.has(stripped) &&
  !ALLOWED_SUFFIXES.some((s) => hostname.endsWith(s))
) {
  return NextResponse.json({ error: 'URL host not permitted' }, { status: 400 })
}
```

Remove the old `if (!url || !url.startsWith('http'))` check entirely — the new `new URL()` + protocol check replaces it.

**Test by:** POST `{"url":"http://169.254.169.254/latest/meta-data/"}` → expect 400 `URL host not permitted`. POST `{"url":"file:///etc/passwd"}` → expect 400 `Invalid URL`. POST a real Greenhouse URL → expect 200.

**Risk:** MEDIUM — allowlist may reject legitimate employer career pages submitted via the manual input field. If users paste a company's custom careers subdomain (e.g. `careers.stripe.com`), it will be blocked. Accept this tradeoff for now; add a fallback message in the UI telling users to paste the job description manually.

---

### Step 2: Await the digest delete in home page
**Files to change:** `src/app/(dashboard)/home/page.tsx`

**What to do:** Replace line 12:
```ts
// before:
supabase.from('digests').delete().eq('user_id', user.id).lt('date', cutoff.toISOString().split('T')[0])

// after:
const { error: cleanupError } = await supabase
  .from('digests')
  .delete()
  .eq('user_id', user.id)
  .lt('date', cutoff.toISOString().split('T')[0])
if (cleanupError) console.error('digest cleanup failed:', cleanupError.message)
```

**Test by:** Open the home page with stale digests in the database older than 5 days. Confirm they are removed. Check server logs for absence of cleanup error.

**Risk:** LOW — purely additive; makes an existing operation synchronous (was already running before reads, now guaranteed to complete first).

---

### Step 3: Guard callGenerate with canGenerate check
**Files to change:** `src/app/(dashboard)/posts/page.tsx`

**What to do:** Add a guard as the first line of `callGenerate` (line 66):
```ts
const callGenerate = async () => {
  if (!canGenerate) return   // ← add this line
  setDrafting(true)
  ...
```

No other changes needed. Covers both news mode (finding [2]) and custom mode (finding [3]) simultaneously.

**Test by:**
- News mode: select a digest → generate → click the digest row again to deselect → click Regenerate inside PostVariants → confirm no network request fires and no crash occurs.
- Custom mode: paste content → generate → clear the textarea → click Regenerate → confirm no network request fires.

**Risk:** LOW — the Generate button already gates on `canGenerate`; this makes Regenerate consistent.

---

### Step 4: Add try/catch to poll() in ResumePipelineStatus
**Files to change:** `src/components/jobs/ResumePipelineStatus.tsx`

**What to do:** Replace lines 45–50:
```ts
async function poll() {
  if (!requestId) return
  try {
    const res = await fetch(`/api/jobs/resume-request?id=${requestId}`)
    if (!res.ok) return  // leave status unchanged; interval will retry
    const data: PollResponse = await res.json()
    if (data.request) setReq(data.request)
  } catch {
    // network error or non-JSON body — interval will retry
  }
}
```

The `res.ok` check prevents `res.json()` from throwing on 502/503 HTML bodies. The outer catch handles `fetch()` throws (DNS failure, connection refused, AbortError from the 10s timeout if one existed).

**Test by:** Temporarily make the `/api/jobs/resume-request` endpoint return a 500 or shut down the dev server mid-poll. Confirm the component stays in its current status state, does not crash, and retries on the next interval tick.

**Risk:** LOW — purely defensive; does not change happy-path behavior.

---

### Step 5: Expand checkVisaWarning patterns
**Files to change:** `src/lib/resume.ts`

**What to do:** Add 5 patterns after the existing 8 in the `patterns` array (after line 274):
```ts
[/permanent\s+(work\s+)?authorization/i, 'Permanent work authorization required'],
[/unrestricted\s+(right\s+to\s+work|work\s+authorization)/i, 'Unrestricted work authorization required'],
[/us\s+nationals?\s+only/i, 'US nationals only'],
[/no\s+sponsorship\s+will\s+be\s+(provided|considered|available|offered)/i, 'No sponsorship considered'],
[/cannot\s+(support|provide|offer)\s+(work\s+)?visa/i, 'Cannot support visa'],
```

**Test by:** Run `checkVisaWarning` against these strings and confirm `visa_warning: true`:
- `"Candidates must have permanent work authorization"`
- `"Must have unrestricted right to work in the US"`
- `"US nationals only may apply"`
- `"No sponsorship will be considered"`
- `"We cannot support work visa transfers"`

Also confirm no false positive on `"This is a permanent remote position"` (the `permanent` pattern requires `work authorization` or similar following it).

**Risk:** LOW — additive only; cannot change behavior for existing matches.

---

### Step 6: Remove duplicate TECH_VOCAB entries
**Files to change:** `src/lib/jobs.ts`

**What to do:**
- Line 108: remove `'Solidity',` from the start of the Web3 block (keep `'Web3.js', 'Ethereum', ...`)
- Line 114: remove `'Redis',` from the tooling block (it appears between `'Prisma'` and `'Celery'`)

After change, line 108 reads:
```ts
'Web3.js', 'Ethereum', 'EVM', 'IPFS', 'DeFi', 'smart contracts', 'blockchain',
```

Line 114 reads:
```ts
'SQLAlchemy', 'Prisma', 'Celery', 'Nginx', 'Linux',
```

**Test by:** Call `extractAtsKeywords` with a description mentioning both "Solidity" and "Redis" once each. Confirm both appear in the result and neither appears twice.

**Risk:** LOW — deduplication in the loop already prevented duplicate output; this just removes the dead second iteration.

---

### Step 7: Unify handleRequestGenerate and handleSearchRequestGenerate
**Files to change:**
- `src/app/(dashboard)/jobs/page.tsx`
- `src/components/jobs/ManualJobInput.tsx`

**What to do:**

1. In `ManualJobInput.tsx` line 9, change the `onRequestGenerate` prop type:
   ```ts
   // before:
   onRequestGenerate: (company: string, title: string, description: string, template: string) => void
   // after:
   onRequestGenerate: (company: string, title: string, description: string, template: ResumeTemplate) => void
   ```
   Add import for `ResumeTemplate` from `@/types/jobs` if not already imported.

2. In `jobs/page.tsx`, add `submitResumeRequest` above `handleRequestGenerate` and simplify both handlers:
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

   async function handleRequestGenerate(company: string, title: string, description: string, template: ResumeTemplate) {
     await submitResumeRequest(company, title, description, template)
   }

   async function handleSearchRequestGenerate(template: ResumeTemplate) {
     if (!selectedJob) return
     await submitResumeRequest(selectedJob.company, selectedJob.title, selectedJob.description, template)
   }
   ```

   Delete the old bodies of both functions (lines 113–125 and 142–160).

**Test by:** In paste mode, fill in a job and click "Queue for Agent" — confirm request is created in Supabase. In search mode, select a job and click "Queue for Agent" — confirm same behavior. Check TypeScript compiler reports no errors (`pnpm build` or `tsc --noEmit`).

**Risk:** MEDIUM — type change in `ManualJobInput` prop; verify the string values passed from that component are valid `ResumeTemplate` union members.

---

### Step 8: Derive selectedDigest from openDigestId
**Files to change:** `src/app/(dashboard)/posts/page.tsx`

**What to do:**

1. Remove the `selectedDigest` useState declaration (line 27):
   ```ts
   // delete:
   const [selectedDigest, setSelectedDigest] = useState<NewsDigest | null>(null)
   ```

2. Add derived variable after `openDigestId` state:
   ```ts
   const selectedDigest = openDigestId ? digests.find((d) => d.id === openDigestId) ?? null : null
   ```

3. Update the click handler (lines 149–152) — remove `setSelectedDigest` call:
   ```ts
   onClick={() => {
     setOpenDigestId(isOpen ? null : digest.id)
   }}
   ```

4. Update the "Use this digest →" button (line 175) — change `setSelectedDigest(digest)` to `setOpenDigestId(digest.id)`:
   ```ts
   onClick={() => setOpenDigestId(digest.id)}
   ```

5. The `isSelected` variable (line 141) already derives from `selectedDigest?.id === digest.id` — now it becomes `openDigestId === digest.id`. Update inline:
   ```ts
   const isSelected = openDigestId === digest.id
   ```
   (Or leave it computing from the derived `selectedDigest` — both are equivalent.)

6. The `fetchDigests` callback (line 49) sets `setOpenDigestId(data[0].id)` on load — this now also implicitly selects the first digest, which is the correct UX.

**Test by:** Switch to News mode. Confirm first digest is pre-selected. Click a different digest row → it expands and becomes selected. Click it again → it collapses and deselects (generate button disables). Click "Use this digest →" on a collapsed digest → it opens and selects. Generate a post → regenerate works. Clear selection → regenerate is blocked.

**Risk:** MEDIUM — UI behavior change: expanding a row now always selects it (previously expand and select were independent). Validate with the intended UX.
