-- Aim Trainer telemetry table.
-- Run this in the Supabase SQL editor (or psql) before starting a session.
--
-- A row is one *segment* of play, not one mesh. Destructible routines close a
-- segment on a click (outcome hit/miss) or a timeout; tracking routines close
-- one every fixed window (outcome track). Every segment carries the routine and
-- difficulty it came from, the board layout at its start, and a per-frame stream
-- of the player's aim together with the engaged target's position.

create table if not exists public.telemetry_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id uuid not null,
  is_human boolean not null,
  bot_mode text,
  -- Which drill produced the row, so modes are separable in training.
  routine text not null,
  difficulty text not null,
  -- hit | miss | timeout | track
  outcome text not null,
  -- Engaged target distance at segment end. Null for a timeout (the target is
  -- already gone) — the per-frame positions still carry it.
  target_distance float8,
  -- Click segments only (hit/miss); null for timeout and track.
  time_to_click_ms int4,
  dwell_ms int4,
  click_offset_x float8,
  click_offset_y float8,
  -- How many targets were on screen at the start of the segment.
  target_count int4,
  -- Board layout at segment start: [{x, y, z, r}].
  targets jsonb,
  -- Per-frame stream: [{t, dx, dy, yaw, pitch, tx, ty, tz, on}]. dx/dy are raw
  -- device counts; yaw/pitch the DPI-independent camera angles; tx/ty/tz the
  -- engaged target's world position; on = crosshair over a target that frame.
  trajectory jsonb not null
);

-- Migration for a table created under the older flick-only schema. Each is
-- idempotent and harmless on a fresh table; on an existing one the new columns
-- arrive nullable, since old rows cannot be backfilled.
alter table public.telemetry_logs add column if not exists routine text;
alter table public.telemetry_logs add column if not exists difficulty text;
alter table public.telemetry_logs add column if not exists outcome text;
alter table public.telemetry_logs add column if not exists dwell_ms int4;
alter table public.telemetry_logs add column if not exists target_count int4;
alter table public.telemetry_logs add column if not exists targets jsonb;
alter table public.telemetry_logs alter column target_distance drop not null;
alter table public.telemetry_logs alter column time_to_click_ms drop not null;

alter table public.telemetry_logs enable row level security;

-- The browser holds only the anon key, so it needs a permissive insert policy.
-- No select policy is granted: rows go in, and are read with the service key.
drop policy if exists "anon insert telemetry" on public.telemetry_logs;

create policy "anon insert telemetry"
  on public.telemetry_logs
  for insert
  to anon
  with check (true);
