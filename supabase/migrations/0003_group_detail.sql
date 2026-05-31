-- 0003 — Group detail: group-scoped posts + group chat (#A53)
--
-- Adds a `group_id` to posts (so a post can belong to one group's feed instead
-- of the global feed) and a `group_messages` table for each group's chat room.
-- The members list + real member count already work off the existing
-- group_members table (0001) — no schema change needed there; the app simply
-- stopped trusting the vanity groups.member_count and counts rows instead.

-- ─── posts.group_id ───────────────────────────────────────────────────────────
alter table public.posts
  add column if not exists group_id text references public.groups(id) on delete cascade;

create index if not exists posts_group_idx on public.posts (group_id, created_at desc);

-- ─── group_messages ───────────────────────────────────────────────────────────
create table if not exists public.group_messages (
  id         text primary key,
  group_id   text not null references public.groups(id) on delete cascade,
  sender_id  text not null references public.users(id)  on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);
create index if not exists group_messages_group_idx on public.group_messages (group_id, created_at);

alter table public.group_messages enable row level security;

-- Open policies, consistent with the other community tables in 0001/0002
-- (the app is single-tenant local-first; real per-user RLS comes with auth).
create policy "group_messages readable" on public.group_messages for select using (true);
create policy "group_messages writable" on public.group_messages for all using (true) with check (true);
