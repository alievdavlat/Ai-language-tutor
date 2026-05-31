-- speakai · cover/thumbnail image columns · 2026-05-31
-- The TS types (platform.types.ts) carry thumbnailUrl/bannerUrl (Course) and
-- imageUrl (LiveStream/LiveAnnouncement/Group/Challenge) but 0001/0002 never
-- created the columns, so real cover images couldn't round-trip through the
-- Supabase backend (only the gradient `cover` did). This adds them.
-- Applied programmatically by scripts/flush-seed.mjs as well.

alter table public.courses            add column if not exists thumbnail_url text;
alter table public.courses            add column if not exists banner_url    text;
alter table public.live_streams       add column if not exists image_url     text;
alter table public.live_announcements add column if not exists image_url     text;
alter table public.groups             add column if not exists image_url     text;
alter table public.challenges         add column if not exists image_url     text;
