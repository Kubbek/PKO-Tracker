-- Uruchom to w Supabase → SQL Editor

-- Turnieje
create table tournaments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  init_bounty numeric not null default 100,
  min_chip numeric not null default 25,
  status text default 'active'
);

-- Gracze
create table players (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  tournament_id uuid references tournaments(id) on delete cascade,
  name text not null,
  table_num integer not null,
  seat integer not null,
  bounty numeric not null default 0,
  pocket_bounty numeric not null default 0,
  active boolean not null default true,
  elim_by text,
  place integer,
  rebuys integer not null default 1
);

-- Eliminacje
create table eliminations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  tournament_id uuid references tournaments(id) on delete cascade,
  winner_id uuid references players(id),
  loser_id uuid references players(id),
  winner_name text,
  loser_name text,
  pocket numeric,
  on_head numeric,
  loser_bounty_before numeric
);

-- Włącz Realtime dla wszystkich tabel
alter publication supabase_realtime add table tournaments;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table eliminations;

-- RLS - pozwól na wszystko (aplikacja nie wymaga auth)
alter table tournaments enable row level security;
alter table players enable row level security;
alter table eliminations enable row level security;

create policy "allow all" on tournaments for all using (true) with check (true);
create policy "allow all" on players for all using (true) with check (true);
create policy "allow all" on eliminations for all using (true) with check (true);
