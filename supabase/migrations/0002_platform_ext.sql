-- speakai schema · extended platform domains · 2026-05-30
-- Mirrors src/shared/types/platform-ext.types.ts
-- Adds: reviews, groups+members, challenges+participants, exam_attempts,
-- vocab_items, dm_threads+messages, media_assets, activity_events, user_stats.
-- Permissive policies for now (match 0001); tighten to auth.uid() when auth lands.

-- ─── reviews ──────────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id          text primary key,
  course_id   text not null references public.courses(id) on delete cascade,
  user_id     text not null references public.users(id) on delete cascade,
  rating      int not null check (rating between 1 and 5),
  text        text not null default '',
  created_at  timestamptz not null default now(),
  unique (course_id, user_id)
);
create index if not exists reviews_course_idx on public.reviews (course_id);

-- ─── groups / clubs ───────────────────────────────────────────────────────────
create table if not exists public.groups (
  id           text primary key,
  name         text not null,
  description  text not null default '',
  language     text not null,
  owner_id     text not null references public.users(id) on delete cascade,
  cover        text not null default '',
  visibility   text not null default 'public' check (visibility in ('public','private')),
  member_count int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists groups_language_idx on public.groups (language);

create table if not exists public.group_members (
  group_id  text not null references public.groups(id) on delete cascade,
  user_id   text not null references public.users(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner','moderator','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists group_members_user_idx on public.group_members (user_id);

-- ─── challenges ───────────────────────────────────────────────────────────────
create table if not exists public.challenges (
  id                text primary key,
  title             text not null,
  description       text not null default '',
  kind              text not null check (kind in ('streak','words','minutes','lessons','custom')),
  goal              int not null default 0,
  language          text not null,
  created_by        text not null references public.users(id) on delete cascade,
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  cover             text not null default '',
  participant_count int not null default 0,
  created_at        timestamptz not null default now()
);
create index if not exists challenges_language_idx on public.challenges (language);

create table if not exists public.challenge_participants (
  challenge_id text not null references public.challenges(id) on delete cascade,
  user_id      text not null references public.users(id) on delete cascade,
  progress     int not null default 0,
  completed_at timestamptz,
  joined_at    timestamptz not null default now(),
  primary key (challenge_id, user_id)
);
create index if not exists challenge_participants_user_idx on public.challenge_participants (user_id);

-- ─── exam attempts ────────────────────────────────────────────────────────────
create table if not exists public.exam_attempts (
  id           text primary key,
  user_id      text not null references public.users(id) on delete cascade,
  kind         text not null check (kind in ('ielts','toefl','cefr','duolingo','sat','gmat','custom')),
  language     text not null,
  overall      numeric(5,2) not null default 0,
  sections     jsonb not null default '{}'::jsonb,
  cefr         text,
  feedback     text,
  duration_min int,
  taken_at     timestamptz not null default now()
);
create index if not exists exam_attempts_user_idx on public.exam_attempts (user_id, taken_at desc);

-- ─── vocabulary items (FSRS) ──────────────────────────────────────────────────
create table if not exists public.vocab_items (
  id               text primary key,
  user_id          text not null references public.users(id) on delete cascade,
  language         text not null,
  term             text not null,
  translation      text not null default '',
  example          text,
  deck             text,
  due              timestamptz not null default now(),
  stability        double precision not null default 0,
  difficulty       double precision not null default 0,
  elapsed_days     int not null default 0,
  scheduled_days   int not null default 0,
  reps             int not null default 0,
  lapses           int not null default 0,
  state            text not null default 'new' check (state in ('new','learning','review','relearning')),
  last_reviewed_at timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists vocab_items_due_idx on public.vocab_items (user_id, due);

-- ─── direct messages ──────────────────────────────────────────────────────────
create table if not exists public.dm_threads (
  id                text primary key,
  participant_ids   text[] not null,
  last_message_at   timestamptz not null default now(),
  last_message_text text,
  created_at        timestamptz not null default now()
);
create index if not exists dm_threads_participants_idx on public.dm_threads using gin (participant_ids);

create table if not exists public.dm_messages (
  id         text primary key,
  thread_id  text not null references public.dm_threads(id) on delete cascade,
  sender_id  text not null references public.users(id) on delete cascade,
  text       text not null default '',
  attachment jsonb,
  read_by    text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists dm_messages_thread_idx on public.dm_messages (thread_id, created_at);

-- ─── media assets ─────────────────────────────────────────────────────────────
create table if not exists public.media_assets (
  id           text primary key,
  owner_id     text not null references public.users(id) on delete cascade,
  kind         text not null check (kind in ('pdf','audio','image','video')),
  url          text not null,
  name         text not null default '',
  size_bytes   bigint not null default 0,
  content_type text,
  created_at   timestamptz not null default now()
);
create index if not exists media_assets_owner_idx on public.media_assets (owner_id, created_at desc);

-- ─── activity events (append-only) + user_stats (projection) ──────────────────
create table if not exists public.activity_events (
  id         text primary key,
  user_id    text not null references public.users(id) on delete cascade,
  kind       text not null,
  language   text,
  meta       jsonb,
  minutes    int,
  xp         int,
  created_at timestamptz not null default now()
);
create index if not exists activity_events_user_idx on public.activity_events (user_id, created_at desc);

create table if not exists public.user_stats (
  user_id          text primary key references public.users(id) on delete cascade,
  xp               int not null default 0,
  streak           int not null default 0,
  longest_streak   int not null default 0,
  last_active_day  date,
  total_minutes    int not null default 0,
  words_learned    int not null default 0,
  lessons_completed int not null default 0,
  daily_goal_min   int not null default 15,
  updated_at       timestamptz not null default now()
);

-- ─── Row Level Security (permissive, matching 0001) ───────────────────────────
alter table public.reviews                enable row level security;
alter table public.groups                 enable row level security;
alter table public.group_members          enable row level security;
alter table public.challenges             enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.exam_attempts          enable row level security;
alter table public.vocab_items            enable row level security;
alter table public.dm_threads             enable row level security;
alter table public.dm_messages            enable row level security;
alter table public.media_assets           enable row level security;
alter table public.activity_events        enable row level security;
alter table public.user_stats             enable row level security;

create policy "reviews readable"  on public.reviews  for select using (true);
create policy "reviews writable"  on public.reviews  for all using (true) with check (true);
create policy "groups readable"   on public.groups   for select using (true);
create policy "groups writable"   on public.groups   for all using (true) with check (true);
create policy "group_members readable" on public.group_members for select using (true);
create policy "group_members writable" on public.group_members for all using (true) with check (true);
create policy "challenges readable" on public.challenges for select using (true);
create policy "challenges writable" on public.challenges for all using (true) with check (true);
create policy "challenge_participants readable" on public.challenge_participants for select using (true);
create policy "challenge_participants writable" on public.challenge_participants for all using (true) with check (true);
create policy "exam_attempts readable" on public.exam_attempts for select using (true);
create policy "exam_attempts writable" on public.exam_attempts for all using (true) with check (true);
create policy "vocab_items readable" on public.vocab_items for select using (true);
create policy "vocab_items writable" on public.vocab_items for all using (true) with check (true);
create policy "dm_threads readable" on public.dm_threads for select using (true);
create policy "dm_threads writable" on public.dm_threads for all using (true) with check (true);
create policy "dm_messages readable" on public.dm_messages for select using (true);
create policy "dm_messages writable" on public.dm_messages for all using (true) with check (true);
create policy "media_assets readable" on public.media_assets for select using (true);
create policy "media_assets writable" on public.media_assets for all using (true) with check (true);
create policy "activity_events readable" on public.activity_events for select using (true);
create policy "activity_events writable" on public.activity_events for all using (true) with check (true);
create policy "user_stats readable" on public.user_stats for select using (true);
create policy "user_stats writable" on public.user_stats for all using (true) with check (true);

-- ─── Storage buckets (Task #24) ───────────────────────────────────────────────
-- PDF + audio uploads. Public read so the renderer can use the returned URL.
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

create policy "uploads readable" on storage.objects for select using (bucket_id = 'uploads');
create policy "uploads writable" on storage.objects for insert with check (bucket_id = 'uploads');
create policy "uploads updatable" on storage.objects for update using (bucket_id = 'uploads');
create policy "uploads deletable" on storage.objects for delete using (bucket_id = 'uploads');
