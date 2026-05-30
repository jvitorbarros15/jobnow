-- Create agent_job_searches table
create table public.agent_job_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  status text not null default 'running' check (status in ('running', 'complete', 'failed')),
  results jsonb not null default '[]',
  summary text,
  sources_searched integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Create index
create index agent_job_searches_user_id_created_at_idx
  on public.agent_job_searches (user_id, created_at desc);

-- Enable RLS
alter table public.agent_job_searches enable row level security;

-- RLS policy: Users select own job searches
create policy "Users select own agent job searches"
  on public.agent_job_searches for select
  using (auth.uid() = user_id);

-- RLS policy: Users insert own job searches
create policy "Users insert own agent job searches"
  on public.agent_job_searches for insert
  with check (auth.uid() = user_id);

-- RLS policy: Users update own job searches
create policy "Users update own agent job searches"
  on public.agent_job_searches for update
  using (auth.uid() = user_id);
