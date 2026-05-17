# Job Maker — Platform Build Plan
**Version 2.4 | May 2026**
Author: Joao Vitor Barros
Build environment: Claude Code

---

## What This Is

A multi-user SaaS platform that acts as an AI-powered job search co-pilot. Three core modules: a Gmail-connected job application tracker that syncs to Google Sheets and auto-creates Google Calendar events for interviews, a LinkedIn post drafter fed by real-time tech news APIs, and a job search engine with an AI resume builder that outputs tailored LaTeX. Built as a real Next.js application, deployed on Vercel, with Supabase as the database and auth layer.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14 (App Router) | You already use Vercel, SSR + API routes in one repo |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent, easy to customize |
| Database | Supabase (Postgres) | Free tier, built-in auth, real-time, Row Level Security |
| Auth | Supabase Auth | Google OAuth (for Gmail access), email/password |
| AI | Anthropic API (server-side) | claude-sonnet-4-5, key never exposed to client |
| Email | Gmail API (OAuth 2.0) | Read threads, no MCP needed in a real backend |
| Calendar | Google Calendar API v3 | Create interview events + alerts, same OAuth scope as Gmail |
| Sheets | Google Sheets API v4 | Write/update rows server-side |
| Job Search | Indeed API + ZipRecruiter API | Structured job data |
| News | NewsAPI + Hacker News API + CryptoPanic API | Three parallel sources |
| Resume | LaTeX via latex.js or Overleaf deep-link | Compile or export |
| Deployment | Vercel | You already use it for ZorAi |
| Package manager | pnpm | Faster than npm |

---

## Repository Structure

```
jobmaker/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts     # OAuth callback
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Sidebar + nav shell
│   │   ├── tracker/page.tsx      # Module 1: Email Tracker
│   │   ├── posts/page.tsx        # Module 2: LinkedIn Post Drafter
│   │   └── jobs/page.tsx         # Module 3: Job Search + Resume Builder
│   └── api/
│       ├── gmail/
│       │   ├── sync/route.ts     # POST: fetch + classify emails
│       │   └── auth/route.ts     # Gmail OAuth token exchange
│       ├── sheets/
│       │   └── update/route.ts   # POST: write rows to Google Sheet
│       ├── calendar/
│       │   └── create-event/route.ts  # POST: create interview event + alerts
│       ├── news/
│       │   ├── fetch/route.ts    # GET: parallel news fetch
│       │   └── generate/route.ts # POST: Claude post generation
│       ├── jobs/
│       │   ├── search/route.ts   # GET: Indeed + ZipRecruiter + web
│       │   └── resume/route.ts   # POST: Claude LaTeX resume builder
│       └── ai/
│           └── classify/route.ts # POST: generic Claude classification
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── tracker/
│   │   ├── JobTable.tsx
│   │   ├── StatusBadge.tsx
│   │   └── SyncButton.tsx
│   ├── posts/
│   │   ├── TopicSelector.tsx
│   │   ├── NewsCard.tsx
│   │   ├── PostVariants.tsx
│   │   └── DraftHistory.tsx
│   └── jobs/
│       ├── JobSearchForm.tsx
│       ├── JobCard.tsx
│       ├── ResumeBuilder.tsx
│       ├── LatexOutput.tsx
│       └── KeywordScore.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client (RSC + API routes)
│   │   └── middleware.ts         # Auth middleware
│   ├── gmail.ts                  # Gmail API helpers
│   ├── sheets.ts                 # Google Sheets API helpers
│   ├── anthropic.ts              # Anthropic SDK wrapper
│   ├── news.ts                   # NewsAPI + HN + CryptoPanic helpers
│   ├── jobs.ts                   # Indeed + ZipRecruiter helpers
│   └── resume.ts                 # LaTeX template engine
├── types/
│   ├── tracker.ts
│   ├── posts.ts
│   └── jobs.ts
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── .env.local                    # Never committed
├── .env.example                  # Committed, all keys documented
├── middleware.ts                 # Protects dashboard routes
└── package.json
```

---

## Database Schema (Supabase / Postgres)

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  gmail_access_token text,       -- encrypted, refreshed via OAuth
  gmail_refresh_token text,
  gmail_token_expiry timestamptz,
  sheets_spreadsheet_id text,    -- user's linked Google Sheet ID
  newsapi_key text,
  cryptopanic_key text,
  timezone text default 'America/New_York',  -- auto-detected on onboarding
  resume_profile jsonb,          -- user's full resume data (see schema below)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Job applications tracker
create table public.job_applications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  company text not null,
  role text not null,
  status text check (status in (
    'applied', 'interview_scheduled', 'interview_completed',
    'offer', 'rejected', 'ghosted', 'follow_up_needed', 'unknown'
  )) default 'unknown',
  date date,
  recruiter_name text,
  recruiter_email text,
  notes text,
  next_action text,
  gmail_thread_id text unique,   -- prevents duplicates on re-sync
  gmail_thread_url text,
  confidence integer,
  synced_to_sheets boolean default false,
  calendar_event_id text,        -- Google Calendar event ID, null if not scheduled
  interview_datetime timestamptz, -- parsed from email by Claude
  interview_location text,        -- "Zoom link", "123 Main St", "Phone call", etc.
  alert_sent boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- LinkedIn post drafts
create table public.post_drafts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  topic text not null,
  topic_preset text,
  source_articles jsonb,         -- array of {title, url, source} objects
  variants jsonb not null,       -- array of 3 {tone, content} objects
  selected_variant integer,      -- 0, 1, or 2
  final_content text,            -- after user edits
  published boolean default false,
  created_at timestamptz default now()
);

-- Saved jobs from search
create table public.saved_jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  title text not null,
  company text not null,
  location text,
  salary text,
  source text check (source in ('Indeed', 'ZipRecruiter', 'LinkedIn', 'Glassdoor')),
  url text not null,
  posted_at text,
  description text,
  ats_keywords jsonb,            -- string array
  created_at timestamptz default now()
);

-- Generated resumes
create table public.resumes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  job_id uuid references public.saved_jobs,
  job_title text,
  company text,
  template_used text check (template_used in (
    'classic_ats', 'modern_clean', 'research_academic', 'blockchain_web3'
  )),
  job_category text check (job_category in (
    'blockchain_web3', 'ai_ml', 'backend_fullstack', 'frontend',
    'research', 'data_engineering', 'devops_infra', 'startup_generalist'
  )),
  projects_included jsonb,       -- string array of project names used
  experience_bullets_used jsonb, -- which bullets were selected per company
  latex_code text not null,
  keyword_match_score integer,
  ats_keywords_matched jsonb,
  missing_skills jsonb,
  created_at timestamptz default now()
);

-- Row Level Security (users only see their own data)
alter table public.profiles enable row level security;
alter table public.job_applications enable row level security;
alter table public.post_drafts enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.resumes enable row level security;

create policy "Users see own profile" on public.profiles
  for all using (auth.uid() = id);

create policy "Users see own applications" on public.job_applications
  for all using (auth.uid() = user_id);

create policy "Users see own drafts" on public.post_drafts
  for all using (auth.uid() = user_id);

create policy "Users see own saved jobs" on public.saved_jobs
  for all using (auth.uid() = user_id);

create policy "Users see own resumes" on public.resumes
  for all using (auth.uid() = user_id);
```

---

## Resume Profile Schema (stored in `profiles.resume_profile` jsonb)

> **NOTE FOR THE RESUME AGENT:** This is the source of truth. Always load this full profile before generating or adjusting any resume. Never fabricate a skill, metric, company, or bullet not present here. If a job requires something not in this profile, list it in `missing_skills` and flag it to the user — do not silently add it.

```json
{
  "personal": {
    "name": "Joao Vitor Barros da Silva",
    "email": "jvitorbarros15@gmail.com",
    "phone": "814-308-3273",
    "location": "State College, PA (relocating Aug 2026)",
    "github": "github.com/jvitorbarros15",
    "linkedin": "linkedin.com/in/joaovi",
    "website": "zorai.vercel.app"
  },
  "education": [
    {
      "school": "The Pennsylvania State University, University Park",
      "degree": "B.S. in Computer Science",
      "minor": "Entrepreneurship and Innovation",
      "graduation": "August 2026",
      "gpa": null
    }
  ],
  "experience": [
    {
      "company": "Library Strategic Technologies, Penn State University Libraries",
      "title": "Software Development Intern",
      "start": "2025-10",
      "end": "present",
      "location": "State College, PA",
      "bullets": [
        "Develop and maintain enterprise full-stack Ruby on Rails applications supporting 40,000+ users across multiple active repositories in a Scrum-based cycle using Docker and RSpec.",
        "Member of the development team for a large-scale PDF remediation and accessibility platform built with AWS and Adobe, supporting uploads of over 3 million PDFs via Adobe APIs and AWS S3.",
        "Designed and implemented a cross-system data integration API using a Rails controller to POST JSON between independent websites, with JSON-to-XML importers and Swagger docs, reducing manual data handling by ~60%.",
        "Built a Python Pandas data pipeline integrated into the Rails platform, cleaning and standardizing faculty data from 17.7K to 9.8K valid entries and cutting manual processing time by over 90%.",
        "Solve engineering tickets, perform code reviews, and validate builds for production readiness using CircleCI for CI."
      ]
    },
    {
      "company": "Blockchain Data Intelligence Lab, Penn State University",
      "title": "Lead Researcher",
      "start": "2025-02",
      "end": "present",
      "location": "State College, PA",
      "bullets": [
        "Developing QLink, a quantum-safe Layer-3 interoperability protocol integrating QKD and PQC schemes (Crystals-Dilithium, Falcon) to secure cross-chain blockchain bridges.",
        "Simulated a 7-validator QLink network over 5–50 km QKD fiber links, achieving up to 707x surplus key throughput and under 1 second latency, outperforming classical bridges by over 400x in cross-chain key refresh rate.",
        "Published: 'QLink: A Quantum Safe Layer 3 Interoperability Protocol for Blockchain Networks,' arXiv:2512.18488, 2025."
      ]
    },
    {
      "company": "Happy Valley LaunchBox, Penn State Startup Accelerator",
      "title": "Innovation and Operations Intern",
      "start": "2023-05",
      "end": "2024-07",
      "location": "State College, PA",
      "bullets": [
        "Spearheaded integration of HubSpot CRM with a new internal UI, centralizing engagement data for 40+ active startups and improving reporting visibility by 45%.",
        "Automated email replies, data entry, and data-fetching workflows using AI in Power Automate, increasing team efficiency by 30%.",
        "Judged multiple startup pitch competitions and provided strategic feedback to early-stage founders."
      ]
    }
  ],
  "projects": [
    {
      "name": "ZorAi",
      "url": "zorai.vercel.app",
      "status": "active",
      "resume_priority": 1,
      "always_include": true,
      "tech": ["React", "Node.js", "Solidity", "OpenAI", "IPFS (Pinata)", "BNB Testnet"],
      "dates": "Mar 2025 – Present",
      "bullets": [
        "Built a platform to register and verify AI-generated images on the blockchain to combat misinformation.",
        "Deployed a BNB testnet dApp integrating OpenAI API for content analysis and Pinata (IPFS) for decentralized storage, achieving consistent verification latency under 3 seconds across tested images.",
        "Built an image detection layer linking online media to on-chain AI records; validated against a test set of AI-generated and real images with strong classification results."
      ]
    },
    {
      "name": "Meridian",
      "status": "active",
      "resume_priority": 2,
      "note": "Strong full-stack project. Use for backend, full-stack, and fintech roles.",
      "tech": ["FastAPI", "Next.js", "React", "PostgreSQL", "Redis", "SQLAlchemy", "Docker", "yfinance", "Tailwind CSS", "Recharts"],
      "dates": "2025 – Present",
      "bullets": [
        "Built a personal investment dashboard tracking Brazilian stocks (B3), FIIs, US equities, and crypto in one place.",
        "Designed a FastAPI + SQLAlchemy async backend with PostgreSQL and Redis, exposing a REST API with auto-generated docs.",
        "Integrated yfinance for real-time market data across B3, US equities, and crypto pairs with a live price refresh endpoint recalculating portfolio returns on demand.",
        "Containerized the full stack with Docker Compose for consistent local and production environments."
      ]
    },
    {
      "name": "Cognitra",
      "status": "active",
      "resume_priority": 3,
      "note": "Use for AI, full-stack, or EdTech roles.",
      "tech": ["React 19", "Next.js 16", "Firebase", "OpenAI", "LangChain", "AssemblyAI", "Tailwind CSS", "React Flow"],
      "dates": "2025 – Present",
      "bullets": [
        "Built a full-stack AI-powered study platform with AI-assisted note-taking, flashcard generation, lecture recording with time tracking, and visual concept mind mapping via React Flow.",
        "Integrated OpenAI and LangChain for AI features, AssemblyAI for lecture transcription, and Firebase for auth and cloud storage.",
        "Supported English and Portuguese via next-i18next internationalization."
      ]
    },
    {
      "name": "NFL 4th Down Conversion Predictor",
      "status": "complete",
      "resume_priority": 4,
      "note": "Use for ML/data science roles.",
      "tech": ["Python", "Pandas", "XGBoost", "Seaborn", "Matplotlib"],
      "dates": "Oct 2025 – Present",
      "bullets": [
        "Built a machine learning model predicting 4th down conversion probabilities using 11 years of NFL play-by-play data (480K plays).",
        "Achieved 62% accuracy, 0.66 ROC-AUC, and 0.23 Brier Score with well-calibrated probability predictions."
      ]
    },
    {
      "name": "Insurance Cost Prediction",
      "status": "complete",
      "resume_priority": 5,
      "note": "Use for ML/data science roles only.",
      "tech": ["Python", "Scikit-learn", "XGBoost", "Seaborn", "Matplotlib"],
      "dates": "Jun 2025 – Jul 2025",
      "bullets": [
        "Designed an end-to-end ML pipeline covering data loading, cleaning, and model evaluation.",
        "Benchmarked XGBoost, Random Forest, Ridge, and Lasso with GridSearchCV. Top performance with XGBoost (R² = 0.868), reducing MAE and MSE by 35% vs baselines."
      ]
    },
    {
      "name": "B3 Stock Clustering",
      "status": "complete",
      "resume_priority": 6,
      "note": "Use for ML or fintech roles only.",
      "tech": ["Python", "PCA", "K-Means", "GMM"],
      "dates": "May 2025 – Jun 2025",
      "bullets": [
        "Clustered 60+ Brazilian stocks by price behavior using K-Means and GMM on normalized financial metrics.",
        "Applied PCA for dimensionality reduction, revealing four clusters: growth, income, small-cap, and blue-chip."
      ]
    },
    {
      "name": "NittanyAuction",
      "status": "complete",
      "resume_priority": 7,
      "note": "Class project (CMPSC 431W). Include only for database-heavy backend roles. Not a differentiator next to ZorAi, Meridian, or Cognitra.",
      "tech": ["Python", "Flask", "SQLite", "HTML/CSS", "JavaScript"],
      "dates": "Spring 2026",
      "bullets": [
        "Built a full-stack auction platform supporting three user roles (Bidders, Sellers, HelpDesk) with role-specific dashboards.",
        "Implemented a fully database-driven multi-level category tree and bidding logic enforcing increment rules, turn-taking constraints, and bid-count-based auction close.",
        "Secured auth with salted SHA-256 hashing, role-based routing, and full payment flow with transaction recording."
      ]
    }
  ],
  "skills": {
    "languages": ["Python", "JavaScript", "Ruby", "Solidity", "C", "Assembly", "SQL"],
    "frameworks": ["Ruby on Rails", "React.js", "Next.js", "Node.js", "Flask", "FastAPI"],
    "ml_ai": ["TensorFlow", "PyTorch", "LangChain", "Scikit-learn", "XGBoost", "Pandas", "NumPy", "LLMs"],
    "blockchain": ["Solidity", "IPFS (Pinata)", "BNB Chain", "EVM", "Web3.js"],
    "cloud_infra": ["AWS S3", "Docker", "Docker Compose", "CircleCI", "Redis", "PostgreSQL", "SQLite", "Firebase"],
    "frontend": ["Tailwind CSS", "shadcn/ui", "Recharts", "React Flow", "HTML/CSS"],
    "tools": ["Git/GitHub", "Figma", "Jira", "Notion", "Swagger", "REST APIs"]
  },
  "certifications": [
    { "name": "AI Agents with RAG & LangChain", "issuer": "IBM", "date": "Jun 2025" },
    { "name": "Deep Learning & Neural Networks", "issuer": "IBM", "date": "Jun 2025" },
    { "name": "Machine Learning with Python", "issuer": "IBM", "date": "Jun 2025" },
    { "name": "AI & Blockchain Certificate", "issuer": "Google", "date": "May 2025" },
    { "name": "ML Web App with Streamlit", "issuer": "Coursera", "date": "Jun 2025" },
    { "name": "Fake News Detection (ML)", "issuer": "Coursera", "date": "May 2025" }
  ],
  "publications": [
    {
      "title": "QLink: A Quantum Safe Layer 3 Interoperability Protocol for Blockchain Networks",
      "venue": "arXiv",
      "id": "arXiv:2512.18488",
      "year": "2025",
      "url": "https://arxiv.org/abs/2512.18488",
      "role": "First author"
    }
  ],
  "leadership": [
    {
      "org": "Nittany Entrepreneur Society",
      "role": "Web Development Team and Outreach",
      "dates": "Jan 2024 – Present",
      "bullets": [
        "Built and maintained the club site (WordPress to React) for a 700+ member community.",
        "Led outreach, organized workshops, and coordinated guest speaker events."
      ]
    }
  ],
  "other": [
    "Blockchain Rio 2025 (event system project)"
  ]
}
```

---

## Environment Variables (.env.example)

```bash
# ─────────────────────────────────────────────
# SUPABASE
# ─────────────────────────────────────────────
# Get from: supabase.com > your project > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server only, never expose

# ─────────────────────────────────────────────
# ANTHROPIC
# ─────────────────────────────────────────────
# Get from: console.anthropic.com > API Keys
ANTHROPIC_API_KEY=sk-ant-...

# ─────────────────────────────────────────────
# GOOGLE (Gmail + Sheets + Calendar)
# ─────────────────────────────────────────────
# Get from: console.cloud.google.com
# Enable: Gmail API, Google Sheets API, Google Drive API, Google Calendar API
# Create OAuth 2.0 credentials (Web application)
# OAuth Scopes to request:
#   https://www.googleapis.com/auth/gmail.readonly
#   https://www.googleapis.com/auth/spreadsheets
#   https://www.googleapis.com/auth/calendar.events
# Authorized redirect URI: http://localhost:3000/api/gmail/auth (dev)
#                          https://yourdomain.com/api/gmail/auth (prod)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/auth

# ─────────────────────────────────────────────
# NEWS APIS
# ─────────────────────────────────────────────
# NewsAPI: free at newsapi.org/register (100 req/day free)
NEWS_API_KEY=your-newsapi-key

# CryptoPanic: free at cryptopanic.com/developers/api
CRYPTOPANIC_API_KEY=your-cryptopanic-key

# Hacker News: no key needed (fully public API)

# ─────────────────────────────────────────────
# JOB SEARCH APIS
# ─────────────────────────────────────────────
# Indeed Publisher API: publisher.indeed.com
INDEED_PUBLISHER_ID=your-indeed-publisher-id

# ZipRecruiter: partners.ziprecruiter.com
ZIPRECRUITER_API_KEY=your-ziprecruiter-key

# ─────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Module 1: Email Job Tracker

### Auth Flow
1. User signs up via Supabase Auth (Google OAuth recommended)
2. On first visit to /tracker, prompted to connect Gmail
3. Gmail OAuth redirect handled at `/api/gmail/auth`
4. Access + refresh tokens stored encrypted in `profiles` table
5. Token auto-refreshes on expiry before each sync

### API Route: POST /api/gmail/sync

```typescript
// Pseudocode — full implementation written in Claude Code
1. Get user session from Supabase (server client)
2. Load Gmail tokens from profiles table
3. Call Gmail API: search threads with job-signal query
4. For each thread not already in job_applications (check by gmail_thread_id):
   a. Fetch full thread content
   b. Call Anthropic API with classification prompt
   c. Parse JSON response
   d. Insert row into job_applications table
   e. If status === 'interview_scheduled' AND interview_datetime is parsed:
      - Call Google Calendar API to create event
      - Store returned calendar_event_id in job_applications row
5. Call Google Sheets API to append/update rows
6. Return { synced: N, skipped: M, calendar_events_created: K, errors: [] }
```

### Gmail Search Query (server-side, not exposed to client)

```
subject:(application OR interview OR offer OR rejection OR "next steps"
         OR "moving forward" OR "not moving forward" OR "your application"
         OR "position" OR "opportunity" OR "hiring" OR "recruiter")
newer_than:30d
-from:noreply@linkedin.com
-from:jobs-noreply@linkedin.com
-category:promotions
```

### Claude Classification Prompt

```
You are a job application email classifier. Given an email thread, return ONLY
valid JSON with no preamble. Schema:
{
  "company": string,
  "role": string,
  "status": "applied" | "interview_scheduled" | "interview_completed"
           | "offer" | "rejected" | "ghosted" | "follow_up_needed" | "unknown",
  "date": "YYYY-MM-DD",
  "recruiter_name": string | null,
  "recruiter_email": string | null,
  "notes": "one sentence max",
  "next_action": string | null,
  "confidence": 0-100,
  "interview_datetime": "ISO 8601 datetime string or null",
  "interview_location": "Zoom link, address, phone call, or null"
}
- Return null if this is not a job-related email.
- Only return entries where confidence >= 60.
- For interview_datetime: extract the exact scheduled date and time from the email
  body. If only a date is mentioned with no time, set time to 09:00 local.
  If no interview is scheduled, return null.
- For interview_location: extract Zoom/Meet link, physical address, or note
  "Phone call". Return null if no location is mentioned.
```

### Google Sheets Integration
- On first sync, app creates a new Sheet named "Job Tracker — [Month Year]"
- Saves spreadsheet ID to `profiles.sheets_spreadsheet_id`
- Subsequent syncs append new rows and update existing ones by thread ID
- Color coding applied via the Sheets API batchUpdate (conditional formatting)

### Google Calendar Integration

#### When a Calendar Event Gets Created
Only triggers when ALL of these are true:
- `status === 'interview_scheduled'`
- `interview_datetime` is successfully parsed (not null)
- No existing `calendar_event_id` for this thread (prevents duplicates)

#### API Route: POST /api/calendar/create-event

```typescript
// Takes: { application_id, company, role, interview_datetime, interview_location, recruiter_name }
// Uses the same Google OAuth tokens already stored for Gmail
// Returns: { calendar_event_id, event_url }

const event = {
  summary: `Interview — ${role} at ${company}`,
  description: [
    `Role: ${role}`,
    `Company: ${company}`,
    recruiter_name ? `Recruiter: ${recruiter_name}` : null,
    `Source: JobMaker auto-detected from email`,
  ].filter(Boolean).join('\n'),
  location: interview_location ?? undefined,
  start: {
    dateTime: interview_datetime,   // ISO 8601
    timeZone: user.timezone,        // stored in profiles table
  },
  end: {
    dateTime: add1Hour(interview_datetime),  // default 1hr duration
    timeZone: user.timezone,
  },
  reminders: {
    useDefault: false,
    overrides: [
      { method: 'email', minutes: 24 * 60 },   // 1 day before
      { method: 'popup', minutes: 60 },          // 1 hour before
      { method: 'popup', minutes: 10 },          // 10 minutes before
    ],
  },
  colorId: '5',   // banana yellow — visually distinct from other calendar events
}
```

#### Edge Cases Handled
- **Rescheduled interview:** If a follow-up email changes the time, Claude detects the new datetime. App calls Calendar API `PATCH` on the existing `calendar_event_id` instead of creating a duplicate.
- **Cancelled interview:** If status changes from `interview_scheduled` to `rejected` or `ghosted`, app deletes the calendar event via Calendar API `DELETE`.
- **Timezone:** User's timezone stored in `profiles.timezone` during onboarding (auto-detected from browser, editable). Passed to every Calendar API call.
- **No datetime parsed:** If Claude can't extract a confident datetime (e.g., "we'll be in touch to schedule"), no event is created. A "Schedule manually" button appears in the tracker UI instead, linking to the Gmail thread.

#### Tracker UI Calendar Column
The `/tracker` table gains a Calendar column:
- Green calendar icon = event created, links to Google Calendar event
- Yellow warning icon = interview detected but datetime unclear, prompts manual scheduling
- Empty = no interview scheduled for this application

---

## Module 2: LinkedIn Post Drafter

### API Route: GET /api/news/fetch

Fires three requests in parallel using `Promise.allSettled`:

```typescript
const [newsApiResults, hnResults, cryptoPanicResults] = await Promise.allSettled([
  fetchNewsAPI(topic, keywords),      // uses NEWS_API_KEY server-side
  fetchHackerNews(keywords),          // no key needed
  fetchCryptoPanic(topic)             // uses CRYPTOPANIC_API_KEY, skipped for non-crypto topics
])
```

NewsAPI and CryptoPanic calls are server-side only, keys never reach the browser.

### News Fetch Logic Per Topic

```
Topic: "AI / LLMs"
  NewsAPI: q="artificial intelligence OR LLM OR GPT OR Claude OR Gemini"
           sortBy=publishedAt, language=en, pageSize=5
  HN: filter topstories where title contains AI, LLM, GPT, model, inference
  CryptoPanic: skip

Topic: "Blockchain / Web3"
  NewsAPI: q="blockchain OR web3 OR ethereum OR solidity OR Base network"
  HN: filter for blockchain, web3, crypto, ethereum, defi
  CryptoPanic: filter=rising, kind=news

Topic: "Onchain AI"
  NewsAPI: q="onchain AI OR decentralized AI OR AI provenance OR verifiable AI"
  HN: filter for onchain, AI+blockchain, verifiable AI
  CryptoPanic: filter by AI + crypto intersection

Topic: "Startup / Founder"
  NewsAPI: q="startup funding OR founder OR Y Combinator OR seed round OR Series A"
  HN: filter for startup, YC, founder, raised, launch
  CryptoPanic: skip

Topic: "Developer Tools"
  NewsAPI: q="developer tools OR devtools OR SDK OR open source"
  HN: prioritize "Show HN" posts, filter for launch, open source, v1.0
  CryptoPanic: skip
```

### API Route: POST /api/news/generate

```typescript
// Takes: { articles: Article[], topic: string, tone: string }
// Returns: { variants: PostVariant[] }
// Calls Anthropic API server-side with full articles as context
```

### Claude Post Generation Prompt

```
You are a LinkedIn ghostwriter for Joao Vitor Barros. Your only job is to write
posts that sound exactly like him, not like an AI assistant writing on his behalf.

---

ABOUT JOAO (context for every post — read this before writing anything):
- CS senior at Penn State, graduating August 2026. Minor in Entrepreneurship and Innovation.
- Founder of ZorAi: decentralized AI content verification dApp (zorai.vercel.app).
  Registers AI-generated images on-chain to combat misinformation. Built with React,
  Node.js, Solidity, OpenAI, IPFS (Pinata). Verification latency under 3 seconds.
- Lead Researcher at Penn State's Blockchain Data Intelligence Lab. Built QLink, a
  quantum-safe Layer-3 blockchain interoperability protocol using QKD + PQC (Crystals-Dilithium,
  Falcon). Simulated 7-validator network: 707x surplus key throughput, under 1s latency,
  400x better than classical bridges. First-author publication: arXiv:2512.18488.
- Software Development Intern at Penn State Libraries: production Ruby on Rails app,
  40,000+ users, 3 million+ PDFs processed, 90% reduction in manual processing time via
  Python Pandas pipeline, ~60% reduction in manual data handling via cross-system API.
- Innovation and Operations Intern at Happy Valley LaunchBox: 40+ startups, HubSpot CRM
  integration (+45% reporting visibility), Power Automate AI workflows (+30% efficiency),
  judged pitch competitions.
- Other active projects: Meridian (investment dashboard, FastAPI + Next.js + PostgreSQL +
  Redis + Docker, tracks B3/US equities/crypto), Cognitra (AI study platform, LangChain +
  AssemblyAI + Firebase + React Flow), NFL 4th Down Predictor (480K plays, XGBoost,
  62% accuracy, 0.66 ROC-AUC).
- Certifications: IBM AI Agents with RAG/LangChain, IBM Deep Learning, Google AI &
  Blockchain, Fake News Detection (ML).
- Member of Nittany Entrepreneur Society (rebuilt club site from WordPress to React, 700+ members).

REAL METRICS TO DRAW FROM WHEN RELEVANT (never invent numbers not on this list):
- 707x surplus key throughput (QLink)
- 400x better cross-chain key refresh rate vs classical bridges (QLink)
- Under 1 second latency (QLink simulation)
- 40,000+ users (Penn State Libraries Rails app)
- 3 million+ PDFs processed (Libraries PDF platform)
- 90% reduction in manual processing time (Python Pandas pipeline)
- 60% reduction in manual data handling (cross-system API)
- 40+ startups (LaunchBox)
- 45% improvement in reporting visibility (HubSpot CRM integration)
- 30% increase in team efficiency (Power Automate workflows)
- Under 3 seconds verification latency (ZorAi)
- 480K plays, 11 years of data (NFL predictor)
- 62% accuracy, 0.66 ROC-AUC (NFL predictor)
- 60+ Brazilian stocks clustered (B3 project)
- XGBoost R² = 0.868, 35% MAE/MSE reduction (Insurance Cost model)
- 700+ member community (Nittany Entrepreneur Society)

---

VOICE RULES (enforce every single one):

Tone:
- Direct. Say what happened and what it produced. No preamble.
- Numbers-first. Concrete metrics beat adjectives every time.
- Honest about the process. Messy is more interesting than a highlight reel.
- Not a hype person. Never "thrilled/honored/humbled to share."

Structure:
- Start with the most interesting thing, not context-setting.
- Write like explaining to another CS student, not to a recruiter.
- One idea per post. No bloated conclusions.
- Short paragraphs. 1-3 sentences max each.
- Max 1300 characters total (LinkedIn sweet spot).
- Hashtags: 3-5 max, bottom only, never mid-post.
- No bullet lists inside the post body.

---

WHAT TO WRITE ABOUT (match to the news articles provided):
- What the news actually means technically, not what it "signals for the industry"
- A personal connection to ZorAi, QLink, Penn State Libraries, or LaunchBox when genuine
- An honest opinion, including a counterpoint if one exists
- What a developer would actually care about, not what sounds impressive

---

POST FORMATS — pick the best fit for the news angle:

Format 1: "The Thing I Learned"
Short, specific, no intro sentence. Observation from work or research.
Pattern: [Specific situation] → [Assumption] → [What was actually true] → [Why it matters]

Format 2: "The Project Update"
What was built, what the result was, one thing that surprised you.
Pattern: [What you finished] → [Key metric or outcome] → [Unexpected thing]

Format 3: "The Opinion"
One thing you think, why, one counterpoint.
Pattern: [Claim] → [Why you believe it, from your own work] → [Steelman of the other side]

Format 4: "The Behind-the-Scenes"
Personal, process-focused, honest about what was hard.
Pattern: [Thing that almost didn't work] → [What the struggle actually looked like] → [What came out of it]

---

HARD BANNED PHRASES AND PATTERNS — never use any of these:
- "Thrilled/honored/humbled/excited to share"
- "In today's rapidly evolving landscape"
- "At the intersection of" (unless it's genuinely specific)
- "Underscores the importance of"
- "Game-changer", "groundbreaking", "robust", "seamless", "impactful"
- Lists of three parallel things: "resilience, discipline, and growth"
- "-ing phrases" as endings: "highlighting the importance of X", "contributing to a better Y"
- "What do you think? Drop a comment below" style CTAs
- Vague hooks designed to bait "see more" clicks
- The word "journey" to describe work
- "Leverage" as a verb
- "Ecosystem" as filler
- Saying something "marks a pivotal moment"
- "Passionate about" anything

---

PRE-PUBLISH CHECKLIST (apply before returning any post):
1. Inflation check: does any sentence overstate what actually happened? Cut it.
2. -ing phrase check: does any sentence end with "...highlighting X" or "...contributing to Y"? Delete it.
3. Vague adjective check: is there an adjective where a number or specific detail could go? Replace it.
4. Rule of three check: is there a list of three parallel abstract things? Pick the one that matters.
5. Rhythm check: if read aloud, does it sound like a TED talk intro? Rewrite it.
6. Authenticity check: would Joao actually say this out loud to another CS student? If no, rewrite it.

---

THREE TONE VARIATIONS TO GENERATE:

"founder_take" — opinionated, slightly contrarian. Joao has a point of view on the news
and isn't afraid to push back on the hype. Grounds it in something he built or observed.

"builder_update" — behind-the-scenes, transparent. Focuses on the technical reality of
what the news means for someone actually building in this space. Honest about tradeoffs.

"hot_take" — short, punchy, 2-3 paragraphs max. A single sharp claim about the news
with a one-sentence defense. No hedging, no "but of course it depends."

---

Return ONLY valid JSON, no preamble, no explanation:
{
  "variants": [
    { "tone": "founder_take", "content": "..." },
    { "tone": "builder_update", "content": "..." },
    { "tone": "hot_take", "content": "..." }
  ]
}
```

### Caching Strategy
- News fetches cached in Supabase for 30 minutes per topic per user
- Prevents burning NewsAPI and CryptoPanic free-tier quotas on repeat clicks
- Cache invalidated manually via "Refresh news" button

---

## Module 3: Job Search + Resume Builder

### 3A: Job Search

### API Route: GET /api/jobs/search

```typescript
// Params: { query, location, remote, salary_min }
// Fires Indeed + ZipRecruiter in parallel
// For LinkedIn/Glassdoor: uses Anthropic web_search tool server-side
// Returns: unified JobResult[] deduplicated by title+company
```

### LinkedIn / Glassdoor Approach (no hallucination policy)
- No data is ever fabricated or inferred
- Web search queries: `site:linkedin.com/jobs "{title}" "{location}" 2026`
- Results clearly labeled with source badge "LinkedIn (web)" or "Glassdoor (web)"
- If a URL cannot be verified as a real job listing, it is dropped

### Job Card Schema

```typescript
interface JobResult {
  id: string
  title: string
  company: string
  location: string
  salary: string | null
  source: 'Indeed' | 'ZipRecruiter' | 'LinkedIn' | 'Glassdoor'
  url: string
  posted_at: string
  description: string
  ats_keywords: string[]   // extracted by Claude on the server
  remote: boolean
}
```

### 3B: Resume Builder

### API Route: POST /api/jobs/resume

```typescript
// Takes: { job: JobResult | jobDescriptionText: string, template: string, userId: string }
// 1. Load user's full resume_profile from Supabase
// 2. Extract ATS keywords from job description (Claude)
// 3. Classify job into primary category (blockchain_web3, ai_ml, backend_fullstack, etc.)
// 4. Run cherry-pick selection:
//    - Select which experience bullets to emphasize per job category
//    - Select 2-3 projects (ZorAi always first, others by category mapping)
//    - Select 15-20 skills that directly match JD keywords
//    - Decide whether to include Publications section
// 5. Select best template for job category
// 6. Generate LaTeX via Claude, passing only selected profile subset + hard rules
// 7. Save to resumes table with job_category recorded
// Returns: { latex_code, keyword_match_score, matched_keywords, missing_skills, job_category }
```

### Resume Selection System — Cherry-Picking by Job Type

> The full profile contains ALL of Joao's experience and projects. The agent must never dump everything onto the resume. It reads the job description, classifies the role, then selects the most relevant subset. The goal is a focused, tailored resume, not a complete biography.

#### Step 1: Classify the Job

Read the job description and assign it a primary category and optional secondary:

| Category | Signal Keywords |
|----------|----------------|
| `blockchain_web3` | Solidity, smart contracts, DeFi, L2, EVM, Web3, on-chain, protocol, crypto |
| `ai_ml` | ML, machine learning, LLM, deep learning, NLP, model training, inference, data science, PyTorch, TensorFlow |
| `backend_fullstack` | REST API, microservices, backend, full-stack, Node, Rails, FastAPI, Flask, PostgreSQL, Redis, Docker |
| `frontend` | React, Next.js, UI, frontend, component library, TypeScript, CSS |
| `research` | research, PhD, protocol, paper, publication, quantum, cryptography, systems |
| `data_engineering` | pipeline, ETL, Pandas, Spark, data warehouse, SQL, analytics |
| `devops_infra` | Docker, Kubernetes, CI/CD, CircleCI, AWS, infrastructure, deployment |
| `startup_generalist` | startup, early-stage, founding engineer, generalist, scrappy, wear many hats |

#### Step 2: Select Experience Bullets

Always include the Penn State Libraries internship — it's the only paid production engineering role. But tailor which bullets to show:

| Job Category | Libraries Bullets to Emphasize |
|---|---|
| `backend_fullstack` | Rails app (40K users), cross-system API, Python pipeline |
| `ai_ml` | Python Pandas pipeline (90% reduction), PDF platform (3M PDFs) |
| `blockchain_web3` | Cross-system API, production scale (shows engineering maturity) |
| `devops_infra` | CircleCI, Docker, RSpec, production build validation |
| `research` | PDF accessibility platform, AWS S3 integration |
| `startup_generalist` | All bullets — shows breadth |

Always include QLink research when the role is `blockchain_web3` or `research`. For all other categories, include it only if space allows — it signals intellectual depth even outside crypto.

Include LaunchBox only for `startup_generalist` or roles at early-stage companies. It's operational experience, not engineering, so it shouldn't crowd out technical bullets for engineering roles.

#### Step 3: Select Projects

ZorAi is always included as the first project. It is never dropped, never moved below another project, never reduced to fewer than 2 bullets.

For the remaining project slots (max 2-3 total projects on a 1-page resume), pick by job category:

| Job Category | Primary Pick | Secondary Pick | Omit |
|---|---|---|---|
| `blockchain_web3` | ZorAi | Meridian (shows full-stack depth) | NFL, Insurance, B3, NittanyAuction |
| `ai_ml` | ZorAi (AI angle) | NFL 4th Down Predictor | Meridian, B3, NittanyAuction |
| `backend_fullstack` | ZorAi | Meridian (FastAPI + PostgreSQL + Redis + Docker) | NFL, Insurance, NittanyAuction |
| `frontend` | ZorAi | Cognitra (React 19, Next.js 16, React Flow, shadcn) | NFL, Insurance, NittanyAuction |
| `research` | ZorAi | QLink (already in experience, condense to 1 project bullet) | NFL, Insurance |
| `data_engineering` | ZorAi | NFL 4th Down (480K plays, XGBoost pipeline) or B3 Clustering | Cognitra, NittanyAuction |
| `devops_infra` | Meridian (Docker Compose, full containerized stack) | ZorAi | NFL, Insurance, NittanyAuction |
| `startup_generalist` | ZorAi | Cognitra or Meridian (whichever is more full-stack) | NFL, Insurance, B3 |

**NittanyAuction rule:** Only include if the job description explicitly mentions database design, multi-role auth systems, or auction/marketplace mechanics. Never include by default.

**B3 Clustering rule:** Only include for data science or quant roles. Never include for engineering roles.

**Insurance Cost Prediction rule:** Only include for ML roles where regression/prediction modeling is a specific requirement.

#### Step 4: Select and Order Skills

Don't list every skill in the profile. Pick 15-20 skills that directly match keywords in the job description, organized into 3-4 groups. Prioritize exact keyword matches over synonyms (e.g., if the JD says "PostgreSQL," use "PostgreSQL" not "SQL").

#### Step 5: Publications

Include the QLink arXiv citation for: `research`, `blockchain_web3`, and any role at a company doing deep tech or protocol work. Omit for pure product engineering roles where it takes up space without adding signal.

---

### Resume Hard Rules (injected into every Claude prompt, never skipped)

```
SOURCE OF TRUTH: You have been given Joao's full profile. This contains ALL his
experience and projects. Do NOT include everything. Your job is to cherry-pick
the most relevant subset for this specific job description, following the
Selection System rules above.

HARD RULES — you must follow every one of these without exception:
1. Output must be exactly 1 page when compiled. If content exceeds 1 page,
   cut bullets and drop lower-priority projects first. ZorAi and education
   are never cut.
2. Output is valid LaTeX only. No markdown, no prose explanation, just code.
3. Active voice in every bullet. Flag and rewrite any passive construction.
4. Every bullet needs a concrete outcome or metric. Use the verified metrics
   list. Do not invent numbers not in the profile.
5. No objective or summary section.
6. Skills section must be tailored to ATS keywords from this specific job.
   Pick 15-20 skills that match the JD. Do not list everything.
7. No photos, colors, icons, or graphics.
8. Fonts: Computer Modern (default LaTeX). No fontspec, no XeLaTeX.
9. Margins: 0.5in all sides via geometry package.
10. Section order: Education, Experience, Projects, Skills, Publications (if included).
11. ZorAi is always the first project listed. Never dropped, never below priority 1.
12. Do not add any skill, technology, or experience not present in the profile.
13. If the job requires skills absent from the profile, list them in the
    "missing_skills" return field. Do not add them to the resume.
14. Return ONLY the LaTeX code. No explanation before or after.
15. After generating, verify: does this resume feel written for THIS job,
    or does it feel like a generic dump of everything? If the latter, revise.
```

### LaTeX Base Template

```latex
\documentclass[letterpaper,11pt]{article}
\usepackage[left=0.5in,right=0.5in,top=0.5in,bottom=0.5in]{geometry}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{titlesec}
\pagestyle{empty}
\setlength{\parindent}{0pt}

\titleformat{\section}{\large\bfseries}{}{0em}{}[\titlerule]
\titlespacing*{\section}{0pt}{6pt}{4pt}

\newcommand{\resumeItem}[1]{\item\small{#1}\vspace{-2pt}}
\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item[]
  \begin{tabular*}{\textwidth}[t]{l@{\extracolsep{\fill}}r}
    \textbf{#1} & \small#2 \\
    \textit{\small#3} & \textit{\small#4}
  \end{tabular*}\vspace{-6pt}
}

\begin{document}
\begin{center}
  {\Huge\bfseries Joao Vitor Barros}\\[4pt]
  \small
  \href{mailto:EMAIL}{EMAIL} ~|~
  \href{https://linkedin.com/in/joaovi}{linkedin.com/in/joaovi} ~|~
  \href{https://github.com/jvitorbarros15}{github.com/jvitorbarros15} ~|~
  \href{https://zorai.vercel.app}{zorai.vercel.app}
\end{center}

% Claude fills in each section below based on the job and profile
\section{Education}
...
\section{Experience}
...
\section{Projects}
...
\section{Technical Skills}
...
\end{document}
```

### Resume Templates

| Template | Best For | Difference from base |
|----------|----------|---------------------|
| `classic_ats` | Big tech, enterprise, applicant tracking | Minimal, no section reordering |
| `modern_clean` | Startups, Series A-B companies | More whitespace, bolder company names |
| `research_academic` | Research roles, PhD programs | Publications section promoted above Skills |
| `blockchain_web3` | Web3 companies, crypto funds, L2 teams | Projects section first, ZorAi and smart contract address prominent |

### LaTeX Compilation Options
- **Option A (MVP):** Output raw LaTeX code with a copy button + "Open in Overleaf" deep-link button (`https://www.overleaf.com/docs?snip={encoded_latex}`)
- **Option B (v2):** Server-side PDF compilation using `node-latex` npm package on a Vercel serverless function, returns PDF blob for download

---

## Authentication & Multi-User Flow

### Supabase Auth Setup
- Primary method: Google OAuth (gets Google tokens needed for Gmail + Sheets)
- Secondary: email/password (for users without Google accounts)
- On OAuth callback: store Google access + refresh tokens in `profiles` table

### Middleware (protects all /dashboard routes)

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && req.nextUrl.pathname.startsWith('/tracker') ||
      req.nextUrl.pathname.startsWith('/posts') ||
      req.nextUrl.pathname.startsWith('/jobs')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return res
}
```

### First-Time User Onboarding Flow
1. Sign up with Google
2. Redirect to `/onboarding`:
   - Step 1: Confirm resume profile (pre-filled from memory, editable)
   - Step 2: Connect Gmail (if not already via Google OAuth, also grants Calendar + Sheets access in same flow)
   - Step 3: Confirm timezone (auto-detected from browser, editable dropdown)
   - Step 4: Add NewsAPI key + CryptoPanic key (optional, skippable)
   - Step 5: Create Google Sheet (auto-created via Sheets API, ID saved)
3. Redirect to `/tracker`

---

## Build Phases

### Phase 1 — Foundation
- [ ] `pnpm create next-app jobmaker --typescript --tailwind --app`
- [ ] Install: `@supabase/supabase-js @supabase/auth-helpers-nextjs @anthropic-ai/sdk shadcn/ui`
- [ ] Supabase project setup + run `001_initial_schema.sql`
- [ ] `.env.local` and `.env.example` with all keys documented
- [ ] Supabase Auth with Google OAuth
- [ ] Route middleware (protect dashboard)
- [ ] Dashboard shell: sidebar nav, 3 routes, responsive layout
- [ ] Onboarding flow (resume profile form, saves to Supabase)

### Phase 2 — Email Tracker + Calendar (Module 1)
- [ ] Google Cloud Console: enable Gmail API + Sheets API + Calendar API, create OAuth credentials
- [ ] Update OAuth scope to include `calendar.events`
- [ ] `/api/gmail/auth` — token exchange + store in Supabase
- [ ] `/api/gmail/sync` — fetch threads, Claude classification, upsert to DB
- [ ] `/api/sheets/update` — write rows to Google Sheet
- [ ] `/api/calendar/create-event` — create interview event with 3 alerts (1 day, 1 hour, 10 min)
- [ ] Calendar patch logic for rescheduled interviews
- [ ] Calendar delete logic for cancelled/ghosted interviews
- [ ] `/tracker` page — table UI, sync button, status badges, calendar column, last sync time
- [ ] Delta sync (only fetch emails newer than last sync timestamp)
- [ ] Deduplication by `gmail_thread_id`
- [ ] "Schedule manually" fallback button for undetected datetimes

### Phase 3 — LinkedIn Post Drafter (Module 2)
- [ ] `/api/news/fetch` — parallel NewsAPI + HN + CryptoPanic
- [ ] `/api/news/generate` — Claude post generation (3 variants)
- [ ] 30-minute news cache in Supabase
- [ ] `/posts` page — topic presets, news cards, 3 variants, inline editor, copy button
- [ ] Draft history (last 20 drafts from DB)
- [ ] "Regenerate with different angle" button

### Phase 4 — Job Search + Resume Builder (Module 3)
- [ ] `/api/jobs/search` — Indeed + ZipRecruiter + web search for LinkedIn/Glassdoor
- [ ] `/api/jobs/resume` — Claude LaTeX resume generation
- [ ] ATS keyword extraction per job listing
- [ ] `/jobs` page — search form, job cards, save job button
- [ ] Resume builder panel — template selector, keyword match score, missing skills
- [ ] LaTeX output with copy button + Overleaf deep-link
- [ ] Saved resumes history from DB

### Phase 5 — Polish + Deploy
- [ ] Mobile-responsive layout audit
- [ ] Loading states and error boundaries on every async action
- [ ] Rate limiting on API routes (Upstash Redis or simple DB counter)
- [ ] Vercel deployment with production env vars
- [ ] Custom domain setup

---

## Design Direction

**Aesthetic:** Dark, terminal-inspired but polished. Think Linear meets a Bloomberg terminal. Monospace for data, serif for headings, sharp status indicators.

**Font stack (via next/font):**
- Display/headings: Instrument Serif
- Code/data: JetBrains Mono
- Body/UI: Geist (Vercel's font, loads fast)

**Color tokens (Tailwind config):**
```
background:  #0a0a0f
surface:     #12121a
border:      #1e1e2e
accent:      #6c63ff
green:       #22c55e   (offer, success)
red:         #ef4444   (rejected)
amber:       #f59e0b   (pending, follow-up)
muted:       #4a4a6a
```

---

## Honest Constraints

| Constraint | Reality |
|-----------|---------|
| NewsAPI free tier | 100 req/day. Server-side caching per topic keeps this well under limit for personal use. Upgrade to $449/yr Developer plan for production SaaS. |
| CryptoPanic free tier | Limited req/day. Same caching strategy applies. |
| Google Calendar API | Free, 1M requests/day. Zero cost concern. Requires `calendar.events` scope added to existing Google OAuth flow, no separate credentials needed. |
| Gmail API quota | 1 billion quota units/day. Sync costs ~50 units per thread. Not a concern. |
| Sheets API | Free, 300 req/min per project. More than enough. |
| LinkedIn / Glassdoor | No official job API. Server-side web search returns real links. Zero hallucination — if Claude can't confirm a URL is a real job posting, it is dropped. |
| LaTeX PDF (MVP) | Overleaf deep-link handles compilation. Node-latex server-side compilation added in Phase 5. |
| Vercel free tier | 100GB bandwidth/month, 100k serverless function invocations. Fine for personal + early users. |
| Indeed API | Publisher API requires approval. Apply at publisher.indeed.com. Approval takes 1-3 days. ZipRecruiter is the fallback during that window. |

---

## Commands to Start in Claude Code

```bash
# 1. Scaffold
pnpm create next-app jobmaker --typescript --tailwind --app --src-dir --import-alias "@/*"
cd jobmaker

# 2. Core dependencies
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs
pnpm add @anthropic-ai/sdk
pnpm add googleapis          # Gmail + Sheets + Calendar API
pnpm add axios               # HTTP client for NewsAPI, CryptoPanic
pnpm add date-fns            # Date formatting
pnpm add uuid
pnpm add zod                 # Runtime type validation on API routes

# 3. Dev dependencies
pnpm add -D @types/uuid

# 4. shadcn/ui
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button badge table card input textarea select tabs

# 5. Supabase CLI
pnpm add -D supabase
pnpx supabase init
pnpx supabase start           # local dev with Docker
pnpx supabase db push         # push schema migrations

# 6. Run dev
pnpm dev
```

---

*End of plan v2.4 — Resume cherry-pick selection system added. Agent classifies job into 8 categories and selects the right experience bullets, projects, and skills for each. ZorAi always first. NittanyAuction, B3, and Insurance Prediction only included when explicitly relevant. Start with Phase 1.*
