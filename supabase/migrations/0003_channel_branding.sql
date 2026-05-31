-- 0003 channel branding (#A43)
-- Profile photo + channel banner for the "My Channel" manager.
-- Idempotent: safe to re-run.

alter table if exists public.users
  add column if not exists avatar_url text,
  add column if not exists banner_url text;
