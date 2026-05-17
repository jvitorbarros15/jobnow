# JobMaker

AI-powered job search co-pilot. Three modules: Gmail job tracker with Google Calendar sync, LinkedIn post drafter fed by real-time tech news, and a job search engine with an AI resume builder that outputs tailored LaTeX.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** Supabase (Postgres + Auth)
- **AI:** Anthropic (claude-sonnet-4-5)
- **APIs:** Gmail, Google Sheets, Google Calendar, NewsAPI, CryptoPanic, Indeed, ZipRecruiter

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in your keys
pnpm dev
```

## Modules

- `/tracker` — sync Gmail → classify with Claude → auto-create Calendar events → update Google Sheets
- `/posts` — fetch tech news → generate 3 LinkedIn post variants with voice rules
- `/jobs` — search Indeed + ZipRecruiter → generate tailored LaTeX resume via Claude
