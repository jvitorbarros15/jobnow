alter table public.agent_job_searches
  add column if not exists source text not null default 'manual';

create index if not exists agent_job_searches_source_idx
  on public.agent_job_searches (user_id, source, created_at desc);
