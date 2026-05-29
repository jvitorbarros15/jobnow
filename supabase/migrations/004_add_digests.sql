-- Create digests table
create table public.digests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  type text not null check (type in ('email', 'news')),
  slot text not null check (slot in ('morning', 'afternoon')),
  date date not null,
  content text not null,
  created_at timestamptz default now()
);

-- Create index
create index digests_user_type_date_slot_idx
  on public.digests (user_id, type, date desc, slot);

-- Enable RLS
alter table public.digests enable row level security;

-- RLS policy: Users see own digests
create policy "Users see own digests"
  on public.digests for select
  using (auth.uid() = user_id);

-- RLS policy: Routines insert digests
create policy "Routines insert digests"
  on public.digests for insert
  with check (auth.uid() = user_id);
