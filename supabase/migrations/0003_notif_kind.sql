-- Notification system (task #17): fine-grained catalog `kind` alongside the
-- broad `type` bucket. Nullable + no check constraint so legacy rows and the
-- existing type CHECK keep working; the renderer infers a kind from `type`
-- when this column is null.

alter table public.notifications add column if not exists kind text;
create index if not exists notifications_kind_idx on public.notifications (kind);
