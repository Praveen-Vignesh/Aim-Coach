-- Aim Trainer telemetry table.
-- Run this in the Supabase SQL editor (or psql) before starting a session.

create table if not exists public.telemetry_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id uuid not null,
  is_human boolean not null,
  bot_mode text,
  target_distance float8 not null,
  time_to_click_ms int4 not null,
  click_result text not null,
  click_offset_x float8,
  click_offset_y float8,
  trajectory jsonb not null
);

alter table public.telemetry_logs enable row level security;

-- The browser holds only the anon key, so it needs a permissive insert policy.
-- No select policy is granted: rows go in, and are read with the service key.
drop policy if exists "anon insert telemetry" on public.telemetry_logs;

create policy "anon insert telemetry"
  on public.telemetry_logs
  for insert
  to anon
  with check (true);
