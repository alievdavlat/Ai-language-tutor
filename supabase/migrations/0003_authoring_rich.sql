-- 0003 — Creator Studio CMS (#A46)
-- Rich teacher-authored content for courses and lessons.
--
-- • lessons.content  — one JSONB blob: { about, body, transcript, materials[] }
-- • courses.about    — rich "About this course" article (markdown)
-- • courses.thumbnail_url / banner_url — the card + hero images the wizard sets
--   (previously only persisted by the local backend).
--
-- Safe to re-run.

alter table if exists public.lessons
  add column if not exists content jsonb;

alter table if exists public.courses
  add column if not exists about text,
  add column if not exists thumbnail_url text,
  add column if not exists banner_url text;
