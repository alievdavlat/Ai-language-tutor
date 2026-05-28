-- speakai schema · 2026-05-28
-- Mirrors src/shared/types/platform.types.ts
-- RLS policies match the access patterns in services/backend/types.ts

-- ─── Extensions ─────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ─── users ──────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id              text primary key,
  name            text not null,
  email           text unique not null,
  role            text not null check (role in ('student', 'teacher', 'admin')),
  avatar_emoji    text,
  bio             text,
  native_language text not null default 'en',
  target_language text not null default 'en',
  level           text,
  country         text,
  created_at      timestamptz not null default now()
);
create index if not exists users_role_idx on public.users (role);
create index if not exists users_target_language_idx on public.users (target_language);

-- ─── courses ────────────────────────────────────────────────────────────────
create table if not exists public.courses (
  id                text primary key,
  teacher_id        text not null references public.users(id) on delete cascade,
  title             text not null,
  description       text not null,
  level             text not null,
  target_language   text not null,
  cover             text not null,
  pricing           jsonb not null,
  rating            numeric(3,2) not null default 0,
  review_count      int not null default 0,
  enrollment_count  int not null default 0,
  hours             int not null default 0,
  published_at      timestamptz,
  capstone          text,
  created_at        timestamptz not null default now()
);
create index if not exists courses_target_language_idx on public.courses (target_language);
create index if not exists courses_teacher_idx on public.courses (teacher_id);
create index if not exists courses_published_idx on public.courses (published_at) where published_at is not null;

-- ─── units & lessons ────────────────────────────────────────────────────────
create table if not exists public.units (
  id         text primary key,
  course_id  text not null references public.courses(id) on delete cascade,
  index      int not null,
  title      text not null,
  about      text
);
create index if not exists units_course_idx on public.units (course_id, index);

create table if not exists public.lessons (
  id           text primary key,
  unit_id      text not null references public.units(id) on delete cascade,
  index        int not null,
  title        text not null,
  kind         text not null check (kind in ('video', 'practice', 'exam', 'rule')),
  video_url    text,
  duration_min int,
  drip_days    int
);
create index if not exists lessons_unit_idx on public.lessons (unit_id, index);

-- ─── enrollments ────────────────────────────────────────────────────────────
create table if not exists public.enrollments (
  user_id        text not null references public.users(id) on delete cascade,
  course_id      text not null references public.courses(id) on delete cascade,
  progress       int not null default 0 check (progress between 0 and 100),
  last_active_at timestamptz not null default now(),
  enrolled_at    timestamptz not null default now(),
  completed_at   timestamptz,
  primary key (user_id, course_id)
);
create index if not exists enrollments_course_idx on public.enrollments (course_id);

-- ─── posts ──────────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id             text primary key,
  author_id      text not null references public.users(id) on delete cascade,
  kind           text not null check (kind in ('text','question','resource','achievement','poll','study-session','voice')),
  text           text not null,
  resource       jsonb,
  poll           jsonb,
  study_session  jsonb,
  achievement    jsonb,
  voice          jsonb,
  reactions      jsonb not null default '{}'::jsonb,
  like_count     int not null default 0,
  comment_count  int not null default 0,
  share_count    int not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_author_idx on public.posts (author_id);

-- ─── likes / saves / follows ────────────────────────────────────────────────
create table if not exists public.likes (
  user_id    text not null references public.users(id) on delete cascade,
  post_id    text not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.saves (
  user_id     text not null references public.users(id) on delete cascade,
  target_kind text not null check (target_kind in ('course', 'post')),
  target_id   text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, target_kind, target_id)
);
create index if not exists saves_target_idx on public.saves (target_kind, target_id);

create table if not exists public.follows (
  follower_id  text not null references public.users(id) on delete cascade,
  following_id text not null references public.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows (following_id);

-- ─── live streams + announcements ───────────────────────────────────────────
create table if not exists public.live_streams (
  id            text primary key,
  host_id       text not null references public.users(id) on delete cascade,
  title         text not null,
  category      text not null,
  language      text not null,
  viewer_count  int not null default 0,
  started_at    timestamptz not null default now(),
  cover         text not null
);
create index if not exists live_streams_language_idx on public.live_streams (language);

create table if not exists public.live_announcements (
  id          text primary key,
  teacher_id  text not null references public.users(id) on delete cascade,
  title       text not null,
  body        text not null,
  when_iso    timestamptz not null,
  cover       text not null
);

-- ─── notifications ──────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id         text primary key,
  user_id    text not null references public.users(id) on delete cascade,
  type       text not null check (type in ('social','learning','system')),
  title      text not null,
  body       text not null,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ─── Row Level Security ────────────────────────────────────────────────────
alter table public.users              enable row level security;
alter table public.courses            enable row level security;
alter table public.units              enable row level security;
alter table public.lessons            enable row level security;
alter table public.enrollments        enable row level security;
alter table public.posts              enable row level security;
alter table public.likes              enable row level security;
alter table public.saves              enable row level security;
alter table public.follows            enable row level security;
alter table public.live_streams       enable row level security;
alter table public.live_announcements enable row level security;
alter table public.notifications      enable row level security;

-- For now we use permissive policies that let the anon key read everything
-- public (courses with publishedAt, posts, users, live streams, announcements)
-- and writes happen via service_role. When Clerk auth lands (P2), we'll
-- tighten these to auth.uid() = user_id checks.

-- users
create policy "users readable to all" on public.users for select using (true);
create policy "users insertable via service role" on public.users for insert with check (true);
create policy "users updatable via service role" on public.users for update using (true);

-- courses
create policy "published courses readable to all"  on public.courses for select using (true);
create policy "course writes via service role"    on public.courses for all using (true) with check (true);

create policy "units readable to all"  on public.units  for select using (true);
create policy "unit writes via service role" on public.units for all using (true) with check (true);

create policy "lessons readable to all" on public.lessons for select using (true);
create policy "lesson writes via service role" on public.lessons for all using (true) with check (true);

-- enrollments — anyone can read; writes via service role
create policy "enrollments readable" on public.enrollments for select using (true);
create policy "enrollment writes via service role" on public.enrollments for all using (true) with check (true);

-- posts
create policy "posts readable to all" on public.posts for select using (true);
create policy "post writes via service role" on public.posts for all using (true) with check (true);

create policy "likes readable" on public.likes for select using (true);
create policy "like writes via service role" on public.likes for all using (true) with check (true);

create policy "saves readable" on public.saves for select using (true);
create policy "save writes via service role" on public.saves for all using (true) with check (true);

create policy "follows readable" on public.follows for select using (true);
create policy "follow writes via service role" on public.follows for all using (true) with check (true);

create policy "live_streams readable" on public.live_streams for select using (true);
create policy "live_stream writes via service role" on public.live_streams for all using (true) with check (true);

create policy "live_announcements readable" on public.live_announcements for select using (true);
create policy "announcement writes via service role" on public.live_announcements for all using (true) with check (true);

create policy "notifications readable" on public.notifications for select using (true);
create policy "notification writes via service role" on public.notifications for all using (true) with check (true);
