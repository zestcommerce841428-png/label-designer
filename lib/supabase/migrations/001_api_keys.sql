-- API key management for external print triggers
-- Run in Supabase SQL Editor after the base schema

create table if not exists api_keys (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  key_prefix   text not null,   -- first 12 chars shown in UI (lf_live_XXXX)
  key_hash     text not null,   -- sha-256 hex of the full key (never stored in plain)
  last_used_at timestamptz,
  created_at   timestamptz default now()
);

alter table api_keys enable row level security;

create policy "Users own their api keys"
  on api_keys for all using (auth.uid() = user_id);
