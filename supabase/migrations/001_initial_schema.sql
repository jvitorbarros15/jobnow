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
