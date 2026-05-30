# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**JobMaker** is an AI-powered job search co-pilot with three core modules:
- **Tracker:** Syncs Gmail → classifies jobs with Claude → auto-creates Calendar events → updates Google Sheets
- **Posts:** Fetches tech news → generates 3 LinkedIn post variants with voice rules
- **Jobs:** Searches Indeed + ZipRecruiter → generates tailored LaTeX resume via Claude

## Tech Stack

- **Framework:** Next.js 16 (App Router) with TypeScript
- **Frontend:** React 19, Tailwind CSS v4
- **Database:** Supabase (Postgres + Auth)
- **AI:** Anthropic SDK (claude-sonnet-4-6)
- **External APIs:** Gmail, Google Sheets, Google Calendar, NewsAPI, Indeed, ZipRecruiter

## Development Commands

```bash
pnpm install           # Install dependencies
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Build for production
pnpm start            # Start production server
```

## Environment Setup

Create `.env.local` in the root with:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ANTHROPIC_API_KEY=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GOOGLE_SHEETS_API_KEY=
GOOGLE_CALENDAR_API_KEY=
INDEED_API_KEY=
ZIPRECRUITER_API_KEY=
NEWSAPI_KEY=
```

## Architecture

### App Structure (Next.js App Router)

```
src/app/
  layout.tsx                    # Root layout, metadata
  page.tsx                      # Redirect to /home
  (auth)/                       # Auth route group (public)
    layout.tsx
    login/                      # Login page
    callback/                   # OAuth callback
    onboarding/                 # Initial setup
  (dashboard)/                  # Dashboard route group (protected)
    layout.tsx                  # Sidebar, auth check, profile data
    home/                       # Home dashboard with digest panels
    tracker/                    # Gmail sync + job applications
    posts/                      # News + LinkedIn draft generation
    jobs/                       # Job search + resume builder
  api/
    auth/signout/
    gmail/auth/                 # Gmail OAuth
    gmail/sync/                 # Fetch & classify emails
    sheets/create-sheet/        # Initialize tracking sheet
    sheets/update/              # Write application data
    calendar/create-event/      # Auto-create interview events
    calendar/update-event/
    calendar/delete-event/
    news/fetch/                 # Fetch tech news
    news/generate/              # Generate post variants
    jobs/search/                # Search Indeed + ZipRecruiter
    jobs/resume/                # Generate LaTeX resume
```

### Database (Supabase)

Key tables populated by the app:
- `profiles` — user account data (API keys, refresh tokens, preferences)
- `job_applications` — parsed job applications from Gmail (status, company, role, etc.)
- `digests` — email and news digests grouped by date/slot (consumed by home dashboard)
- `linkedin_posts` — generated post variants with source news

Auth handled by Supabase.

### Key Libraries & Patterns

**Supabase Auth:**
- Server client: `src/lib/supabase/server.ts` (use in Server Components & API routes)
- Client client: `src/lib/supabase/client.ts` (use in Client Components)
- Middleware: `src/lib/supabase/middleware.ts` (session refresh)
- Protected routes checked in layout.tsx via `supabase.auth.getUser()`

**AI Integration:**
- `src/lib/anthropic.ts` — Anthropic SDK initialization
- Used for: email classification, post generation, resume tailoring

**External APIs:**
- `src/lib/gmail.ts` — Gmail integration (fetch, mark read)
- `src/lib/calendar.ts` — Google Calendar (create/update/delete events)
- `src/lib/sheets.ts` — Google Sheets (write application tracking data)
- `src/lib/news.ts` — NewsAPI + CryptoPanic (fetch news for posts)
- `src/lib/jobs.ts` — Indeed + ZipRecruiter job search
- `src/lib/resume.ts` — LaTeX resume generation from job & user profile

**Types:**
- `src/types/tracker.ts` — Application, Event, Digest types
- `src/types/jobs.ts` — Job search result types
- `src/types/posts.ts` — News digest, LinkedIn post types
- `src/types/supabase.ts` — Database schema (auto-generated)

### Component Organization

**Dashboard Components:**
- `src/components/Sidebar.tsx` — Main navigation (Home, Tracker, Posts, Jobs, Sign Out)
- `src/components/NavLink.tsx` — Active state link styling

**Tracker Module:**
- `JobTable.tsx` — Sortable applications table with inline status update
- `SyncButton.tsx` — Trigger Gmail sync
- `StatsCard.tsx` — Metric display (active, interviews, offers)

**Posts Module:**
- `NewsCard.tsx` — Single news item with generated variants
- `PostVariants.tsx` — Three draft options (each variant selectable)
- `DraftHistory.tsx` — Chronological view of generated posts
- `TopicSelector.tsx` — Filter news by topic

**Jobs Module:**
- `JobSearchForm.tsx` — Query builder (role, location, salary filter)
- `JobCard.tsx` — Individual job listing with match score
- `ResumeBuilder.tsx` — Integration panel (pick job → generate tailored LaTeX resume)
- `LatexOutput.tsx` — Resume editor + copy/download
- `KeywordScore.tsx` — Match analysis (skills overlap)
- `ManualJobInput.tsx` — Fallback for manually entering a job

**Home Module:**
- `DigestPanel.tsx` — Tabbed accordion of email/news digests
- `DigestEntry.tsx` — Single digest row (date, slot, preview)

## Design System

- **Colors:** Tailwind default palette with subtle grays for contrast & focus
- **Typography:** System font stack (Tailwind default), strong hierarchy via font-size + weight
- **Spacing:** Tailwind scale (0.25rem increments) for consistent rhythm
- **Interactions:** Minimal transitions; focus states on interactive elements (links, buttons, inputs)
- **Reference:** Stripe Dashboard aesthetic — data-rich, zero decoration, confident simplicity

## Common Workflows

### Adding a New API Integration

1. Create `src/lib/{service}.ts` with SDK initialization & reusable functions
2. Create `src/app/api/{service}/{action}/route.ts` for POST endpoints
3. Add environment variables to `.env.local` and validate in the library
4. Call from Server Components or API routes; never expose secrets to the client
5. Type all responses and store in Supabase if needed (via `sheets.ts` pattern or direct insertion)

### Modifying a Page

1. Edit `src/app/(dashboard)/{module}/page.tsx` (Server Component)
2. Fetch data from Supabase directly or call an API route
3. Pass data to Client Components for interactivity
4. Use existing StatsCard/JobTable/NewsCard patterns if applicable

### Adding a New Component

1. Create in `src/components/{module}/{ComponentName}.tsx`
2. Use Client Components (`"use client"`) only if stateful or event-heavy
3. Import Lucide icons from `lucide-react`
4. Style with Tailwind; no external CSS files except `globals.css`

## Testing & Deployment

- No test suite configured yet. Manual verification via `pnpm dev` is the current norm.
- Vercel deployment ready (no special config needed; uses Next.js defaults).
- Environment variables must be set in Vercel project settings.

## Important Notes

- **Auth & Secrets:** All API keys and refresh tokens stored in `profiles` table. Never log or expose them.
- **Email Classification:** Claude is used to parse Gmail subjects/bodies and extract: company, role, status (applied, interviewed, offered, rejected, unknown). Classification rules are not yet formalized; future iterations should expand the ruleset.
- **Database Schema:** Supabase types in `src/types/supabase.ts` are marked as `any` and should be auto-generated via Supabase CLI once the schema is finalized.
- **Digest Grouping:** Digests are grouped by `(user_id, type, date, slot)` where slot is a logical grouping within a day (e.g., morning/afternoon emails, today's news). The home dashboard renders them as a tabbed accordion.
- **Rate Limiting:** Gmail and Google APIs have per-user quotas. Sync operations should be polled by the user, not triggered automatically, to avoid quota overages.
