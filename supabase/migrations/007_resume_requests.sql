-- resume_requests: stores pending agent jobs from the web UI
create table public.resume_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  job_title text not null,
  company text not null,
  job_description text not null,
  template text not null default 'classic_ats',
  status text not null default 'pending'
    check (status in ('pending', 'building', 'reviewing', 'complete', 'failed')),
  resume_id uuid references public.resumes(id),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index resume_requests_user_id_created_at_idx
  on public.resume_requests (user_id, created_at desc);

alter table public.resume_requests enable row level security;

create policy "Users select own resume requests"
  on public.resume_requests for select
  using (auth.uid() = user_id);

create policy "Users insert own resume requests"
  on public.resume_requests for insert
  with check (auth.uid() = user_id);

create policy "Users update own resume requests"
  on public.resume_requests for update
  using (auth.uid() = user_id);

-- Add review fields to resumes table
alter table public.resumes
  add column if not exists review_score integer,
  add column if not exists review_keywords text[] not null default '{}',
  add column if not exists review_red_flags jsonb not null default '[]',
  add column if not exists reviewed_latex text,
  add column if not exists job_title text,
  add column if not exists company text;
