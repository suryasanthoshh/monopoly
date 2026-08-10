-- Run this in the Supabase SQL Editor (Project > SQL Editor > New Query).

create table if not exists public.games (
  code text primary key,
  state jsonb not null,
  created_at timestamptz not null default now()
);

-- Row Level Security: this is a casual party game, so access is gated only by
-- knowing the room code (no user accounts). Anyone with the code can read and
-- update the room's state. If you later add Supabase Auth, tighten these to
-- check auth.uid() against a players table instead.
alter table public.games enable row level security;

create policy "Anyone can read a game by code"
  on public.games for select
  using (true);

create policy "Anyone can create a game"
  on public.games for insert
  with check (true);

create policy "Anyone can update a game"
  on public.games for update
  using (true);

-- Enable Realtime so clients receive UPDATE events on this table.
alter publication supabase_realtime add table public.games;

-- Optional: clean up old games automatically after 24h (requires pg_cron
-- extension, enabled by default on most Supabase projects). Safe to skip.
-- select cron.schedule('cleanup-old-games', '0 * * * *', $$
--   delete from public.games where created_at < now() - interval '24 hours'
-- $$);
