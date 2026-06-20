-- Label Designer MVP Schema

create extension if not exists "uuid-ossp";

-- Users handled by Supabase Auth (auth.users)

create table if not exists labels (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null default 'Untitled Label',
  canvas_json jsonb not null default '{}',
  size_config jsonb not null default '{"width":100,"height":50,"unit":"mm"}',
  thumbnail   text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists template_library (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  category     text not null,
  canvas_json  jsonb not null default '{}',
  size_config  jsonb not null default '{"width":100,"height":50,"unit":"mm"}',
  thumbnail    text,
  is_public    boolean default true,
  created_at   timestamptz default now()
);

create table if not exists print_jobs (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  label_id     uuid references labels(id) on delete set null,
  label_name   text not null,
  record_count int default 1,
  pdf_url      text,
  status       text default 'pending' check (status in ('pending','processing','done','failed')),
  created_at   timestamptz default now()
);

create table if not exists data_sources (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  label_id    uuid references labels(id) on delete cascade,
  name        text not null,
  type        text not null check (type in ('csv','excel','json','manual')),
  columns     jsonb default '[]',
  rows        jsonb default '[]',
  created_at  timestamptz default now()
);

-- RLS
alter table labels enable row level security;
alter table print_jobs enable row level security;
alter table data_sources enable row level security;

create policy "Users own their labels"
  on labels for all using (auth.uid() = user_id);

create policy "Users own their print jobs"
  on print_jobs for all using (auth.uid() = user_id);

create policy "Users own their data sources"
  on data_sources for all using (auth.uid() = user_id);

create policy "Public templates are visible to all"
  on template_library for select using (is_public = true);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger labels_updated_at
  before update on labels
  for each row execute function update_updated_at();
