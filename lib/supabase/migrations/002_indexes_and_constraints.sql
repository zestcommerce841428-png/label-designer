-- Migration 002 — Performance indexes & data integrity constraints
-- Run in Supabase SQL Editor after 001_api_keys.sql

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Most common query pattern: user's labels ordered by most-recently-updated
create index if not exists idx_labels_user_updated
  on labels (user_id, updated_at desc);

-- Print history queries
create index if not exists idx_print_jobs_user_created
  on print_jobs (user_id, created_at desc);

-- API key lookup by hash (called on every authenticated API request)
create index if not exists idx_api_keys_hash
  on api_keys (key_hash);

-- API key management by user
create index if not exists idx_api_keys_user
  on api_keys (user_id);

-- Data source listing per user
create index if not exists idx_data_sources_user
  on data_sources (user_id);

-- ── Data integrity ────────────────────────────────────────────────────────────

-- Prevent nonsensical record counts in print_jobs
do $$ begin
  alter table print_jobs
    add constraint chk_record_count
    check (record_count >= 0 and record_count <= 100000);
exception when duplicate_object then null; end $$;

-- Prevent duplicate data source names per user
do $$ begin
  alter table data_sources
    add constraint uq_data_sources_user_name
    unique (user_id, name);
exception when duplicate_object then null; end $$;

-- Prevent empty label names
do $$ begin
  alter table labels
    add constraint chk_label_name_nonempty
    check (length(trim(name)) > 0);
exception when duplicate_object then null; end $$;
