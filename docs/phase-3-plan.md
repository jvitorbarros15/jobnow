# Phase 3 — LinkedIn Post Drafter

**Goal:** Build the news-to-post pipeline. Fetch real tech news from 3 parallel sources, feed it into Claude with strict voice rules, generate 3 tone variants, let the user edit and copy.

---

## Tasks

### Task 1: `src/lib/news.ts` — news fetch helpers

Three separate fetchers, each with its own query logic per topic.

**NewsAPI** (`NEWS_API_KEY` env, server-only)
- Base URL: `https://newsapi.org/v2/everything`
- Params: `sortBy=publishedAt`, `language=en`, `pageSize=5`
- Per topic queries:
  - `AI / LLMs`: `q="artificial intelligence OR LLM OR GPT OR Claude OR Gemini"`
  - `Blockchain / Web3`: `q="blockchain OR web3 OR ethereum OR solidity OR Base network"`
  - `Onchain AI`: `q="onchain AI OR decentralized AI OR AI provenance OR verifiable AI"`
  - `Startup / Founder`: `q="startup funding OR founder OR Y Combinator OR seed round OR Series A"`
  - `Developer Tools`: `q="developer tools OR devtools OR SDK OR open source"`
- Returns: `NewsArticle[]` — title, url, source: 'NewsAPI', publishedAt

**HackerNews** (no key, public API)
- Fetch `https://hacker-news.firebaseio.com/v2/topstories.json` → top 100 story IDs
- Fetch each story in parallel (use `Promise.allSettled`, limit to first 30 IDs)
- Filter by title keywords per topic:
  - `AI / LLMs`: title contains AI, LLM, GPT, model, inference, Gemini, Claude
  - `Blockchain / Web3`: blockchain, web3, crypto, ethereum, defi, solidity
  - `Onchain AI`: onchain, AI+blockchain, verifiable
  - `Startup / Founder`: startup, YC, Y Combinator, raised, launch, founder
  - `Developer Tools`: "Show HN", open source, v1.0, launch, SDK, CLI, devtools
- Returns: top 3-5 matching stories as `NewsArticle[]` with source: 'HackerNews'

**CryptoPanic** (`CRYPTOPANIC_API_KEY` env, server-only)
- Base URL: `https://cryptopanic.com/api/v1/posts/`
- Only called for: `Blockchain / Web3` and `Onchain AI` topics
- Params: `filter=rising`, `kind=news`
- Returns: up to 3 articles as `NewsArticle[]` with source: 'CryptoPanic'

**Combined result** per fetch call:
```typescript
export async function fetchNewsByTopic(topic: string): Promise<NewsArticle[]>
```
- Fires all 3 in `Promise.allSettled`
- Merges results, deduplicates by URL
- Returns max 8-10 articles total

---

### Task 2: `/api/news/fetch` — fetch with 30-minute cache

**GET `/api/news/fetch?topic=AI+%2F+LLMs`**

1. Get user from Supabase auth
2. Check cache: look in `post_drafts` table OR a simple Supabase `news_cache` table
   - Cache key: `user_id + topic`
   - Cache TTL: 30 minutes (`created_at > now() - interval '30 minutes'`)
   - If cache hit: return cached articles
3. If cache miss: call `fetchNewsByTopic(topic)` from `src/lib/news.ts`
4. Store result in cache table with timestamp
5. Return `{ articles: NewsArticle[], cached: boolean, fetched_at: string }`

**Cache table** (add to Supabase migrations):
```sql
create table public.news_cache (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade,
  topic text not null,
  articles jsonb not null,
  created_at timestamptz default now(),
  unique(user_id, topic)
);
alter table public.news_cache enable row level security;
create policy "Users see own cache" on public.news_cache
  for all using (auth.uid() = user_id);
```

**"Refresh news" button** in UI calls this endpoint with `?force=true` to bypass cache.

---

### Task 3: `/api/news/generate` — Claude post generation

**POST `/api/news/generate`**

Input:
```typescript
{ articles: NewsArticle[], topic: string }
```

1. Get user from Supabase auth
2. Build Claude prompt with:
   - Full system prompt (voice rules, about Joao, hard-banned phrases, pre-publish checklist)
   - User message: list of articles (title + URL + snippet) + topic
3. Call `anthropic.messages.create()` with model `claude-sonnet-4-5`
4. Parse returned JSON: `{ variants: [{ tone, content }, ...] }`
5. Save to `post_drafts` table:
   ```typescript
   {
     user_id,
     topic,
     source_articles: articles,
     variants: parsedVariants,
     selected_variant: null,
     final_content: null,
     published: false,
   }
   ```
6. Return `{ draft_id, variants }`

**The full Claude prompt** (from JOBMAKER_PLATFORM_PLAN.md lines 688-831) must be injected verbatim as the system prompt. Never truncate it.

---

### Task 4: `/posts` page — full UI

Replaces the current placeholder. Full interactive flow.

**Layout:** Two-column on desktop (news left, post editor right), stacked on mobile.

**Section 1 — Topic selector**
- Horizontal pills: `AI / LLMs`, `Blockchain / Web3`, `Onchain AI`, `Startup / Founder`, `Developer Tools`
- First pill selected by default (accent border + background)
- Clicking a pill triggers news fetch for that topic

**Section 2 — News feed (left column)**
- "Latest News" header + "Refresh" button (forces re-fetch)
- Loading skeleton: 3 pulsing cards while fetching
- Each `NewsCard`:
  - Source badge (`NewsAPI` / `HackerNews` / `CryptoPanic`) with color coding
  - Article title (truncated at 2 lines)
  - Relative time (e.g. "2 hours ago")
  - External link icon → opens article URL
- "Generate Post" button at bottom of news list (accent, large)
  - Disabled until at least 1 article loaded
  - Shows loading state while Claude generates

**Section 3 — Post variants (right column)**
- Only visible after generation
- Three tab buttons: `Founder Take` | `Builder Update` | `Hot Take`
- Active variant displayed in editable `<textarea>`
- Character count (target ≤ 1300)
- "Copy to clipboard" button with feedback ("Copied!")
- "Regenerate" button — calls generate again with same articles

**Section 4 — Draft history**
- Collapsed section below or in a drawer
- Shows last 20 drafts from `post_drafts` table
- Each row: topic, first 80 chars of selected variant, date
- Click to restore draft into editor

**Components to create:**
- `src/components/posts/TopicSelector.tsx`
- `src/components/posts/NewsCard.tsx`
- `src/components/posts/PostVariants.tsx`
- `src/components/posts/DraftHistory.tsx`

---

## Execution Order

```
Task 1 (news helpers)
  └─> Task 2 (fetch endpoint) ─┐
                                ├─> Task 4 (UI)
      Task 3 (generate endpoint)┘
```

Tasks 2 and 3 can be built in parallel after Task 1.

---

## Migration needed

Add `news_cache` table (Task 2 above). New file:
`supabase/migrations/003_add_news_cache.sql`

---

## Env vars required

- `NEWS_API_KEY` — newsapi.org (free: 100 req/day)
- `CRYPTOPANIC_API_KEY` — cryptopanic.com (free tier)
- `ANTHROPIC_API_KEY` — already set

HackerNews: no key needed.

---

## Definition of done

- [ ] `src/lib/news.ts` — all 3 fetchers + `fetchNewsByTopic()`
- [ ] `/api/news/fetch` — caching works, force-refresh works
- [ ] `/api/news/generate` — returns 3 variants, saves to DB
- [ ] `/posts` page — topic select → fetch news → generate → edit → copy
- [ ] Draft history shows last 20 drafts
- [ ] "Regenerate" button works
- [ ] Mobile responsive
- [ ] Build passes
