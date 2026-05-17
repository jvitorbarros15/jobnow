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
