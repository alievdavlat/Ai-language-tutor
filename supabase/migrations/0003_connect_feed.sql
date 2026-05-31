-- speakai schema · Connect feed interactions · 2026-05-31 (task #A28)
-- Persists the feed elements that were previously ephemeral React state:
--   post emoji reactions, poll votes, and threaded comments (+ comment likes).
-- Study-session membership stays in posts.study_session.joinedIds (jsonb), so
-- no extra table is needed there.
-- Permissive policies for now (match 0001/0002); tighten to auth.uid() when auth lands.

-- ─── post reactions (one emoji per user per post) ─────────────────────────────
create table if not exists public.post_reactions (
  post_id    text not null references public.posts(id) on delete cascade,
  user_id    text not null references public.users(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists post_reactions_post_idx on public.post_reactions (post_id);

-- ─── poll votes (one option per user per post) ────────────────────────────────
create table if not exists public.poll_votes (
  post_id    text not null references public.posts(id) on delete cascade,
  user_id    text not null references public.users(id) on delete cascade,
  option_id  text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists poll_votes_post_idx on public.poll_votes (post_id);

-- ─── threaded comments (course/video/lesson/book/post) ────────────────────────
create table if not exists public.comments (
  id          text primary key,
  target_kind text not null check (target_kind in ('course','video','lesson','book','post')),
  target_id   text not null,
  author_id   text not null references public.users(id) on delete cascade,
  text        text not null,
  parent_id   text references public.comments(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index if not exists comments_target_idx on public.comments (target_kind, target_id, created_at desc);
create index if not exists comments_parent_idx on public.comments (parent_id);

create table if not exists public.comment_likes (
  comment_id text not null references public.comments(id) on delete cascade,
  user_id    text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- ─── Row Level Security (permissive, matching 0001/0002) ──────────────────────
alter table public.post_reactions enable row level security;
alter table public.poll_votes     enable row level security;
alter table public.comments       enable row level security;
alter table public.comment_likes  enable row level security;

create policy "post_reactions readable" on public.post_reactions for select using (true);
create policy "post_reactions writable" on public.post_reactions for all using (true) with check (true);
create policy "poll_votes readable" on public.poll_votes for select using (true);
create policy "poll_votes writable" on public.poll_votes for all using (true) with check (true);
create policy "comments readable" on public.comments for select using (true);
create policy "comments writable" on public.comments for all using (true) with check (true);
create policy "comment_likes readable" on public.comment_likes for select using (true);
create policy "comment_likes writable" on public.comment_likes for all using (true) with check (true);
