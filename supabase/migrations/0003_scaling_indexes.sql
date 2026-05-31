-- speakai schema · scaling cheap-wins · 2026-05-31 (#A64)
-- Adds the indexes the hot list endpoints actually need at volume, plus an
-- archive table + sweep function so the append-only activity_events table stays
-- small. Idempotent (if-not-exists / or-replace) so it's safe to re-run.

-- ─── Trigram search indexes ───────────────────────────────────────────────────
-- listUsers / listCourses / listGroups all do `ilike '%q%'`, which can't use a
-- plain btree index. pg_trgm + GIN makes those substring searches index-backed.
create extension if not exists pg_trgm;

create index if not exists users_name_trgm    on public.users  using gin (name gin_trgm_ops);
create index if not exists users_email_trgm   on public.users  using gin (email gin_trgm_ops);
create index if not exists courses_title_trgm  on public.courses using gin (title gin_trgm_ops);
create index if not exists courses_desc_trgm   on public.courses using gin (description gin_trgm_ops);
create index if not exists groups_name_trgm    on public.groups  using gin (name gin_trgm_ops);
create index if not exists groups_desc_trgm    on public.groups  using gin (description gin_trgm_ops);

-- ─── Default-ordering indexes ─────────────────────────────────────────────────
-- listCourses sorts published courses by enrollment_count desc. A partial index
-- over just the published rows serves both the filter and the ORDER BY.
create index if not exists courses_enrollment_idx
  on public.courses (enrollment_count desc)
  where published_at is not null;

-- listGroups (public only) sorts by member_count desc.
create index if not exists groups_member_count_idx
  on public.groups (member_count desc)
  where visibility = 'public';

-- listChallenges sorts by participant_count desc.
create index if not exists challenges_participant_count_idx
  on public.challenges (participant_count desc);

-- ─── activity_events archival ─────────────────────────────────────────────────
-- activity_events is append-only and grows fastest of all tables. user_stats is
-- a precomputed projection, so raw events older than the retention window can be
-- moved out of the hot table without losing any user-facing data.

-- Plain created_at index so the archive sweep's range delete doesn't full-scan.
create index if not exists activity_events_created_idx
  on public.activity_events (created_at);

-- Cold store — same shape (columns + defaults + indexes), no FK cascade so it
-- survives a user delete as an audit trail.
create table if not exists public.activity_events_archive
  (like public.activity_events including defaults including indexes);

alter table public.activity_events_archive enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'activity_events_archive'
  ) then
    create policy "activity_events_archive readable" on public.activity_events_archive for select using (true);
    create policy "activity_events_archive writable" on public.activity_events_archive for all using (true) with check (true);
  end if;
end$$;

-- Move events older than `retention_days` (default 90) into the archive in one
-- pass; returns how many rows were archived. Schedule with pg_cron, e.g.:
--   select cron.schedule('archive-activity', '0 3 * * *',
--                        $$ select public.archive_old_activity_events(90) $$);
create or replace function public.archive_old_activity_events(retention_days int default 90)
returns int
language plpgsql
as $$
declare
  moved int;
begin
  with cutoff as (
    delete from public.activity_events
    where created_at < now() - make_interval(days => retention_days)
    returning *
  )
  insert into public.activity_events_archive
  select * from cutoff;
  get diagnostics moved = row_count;
  return moved;
end;
$$;
