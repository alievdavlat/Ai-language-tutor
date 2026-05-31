-- speakai schema · duplicate-content prevention (#A65) · 2026-05-31
-- Adds a canonical `content_hash` fingerprint to the entities that hold
-- user-uploaded / authored content, so duplicates can be detected by an indexed
-- string compare. The key is built client-side by `services/dedup`:
--   • file uploads (pdf/audio/image/video) → 'file:<sha256>'
--   • videos / clips                        → 'yt:<youtubeId>'
--   • books (no file)                       → 'isbn:<digits>' | 'ta:<title>|<author>'
--   • courses / stories                     → 'to:<title>|<ownerId>'
-- Idempotent: safe to re-run.

-- ─── media_assets — file-level fingerprint (storage dedupe / ref-count) ─────────
alter table public.media_assets
  add column if not exists content_hash text;
create index if not exists media_assets_content_hash_idx
  on public.media_assets (content_hash)
  where content_hash is not null;

-- ─── courses — title+owner fingerprint ──────────────────────────────────────────
alter table public.courses
  add column if not exists content_hash text;
-- A teacher should not own two courses with the same content key. Partial unique
-- index ignores legacy rows where content_hash is still null.
create unique index if not exists courses_content_hash_uniq
  on public.courses (content_hash)
  where content_hash is not null;
