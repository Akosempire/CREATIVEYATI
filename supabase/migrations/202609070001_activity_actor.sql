-- Phase 1a: let the activity log say who did it.
--
-- The table already records what happened, where and when:
--   title, description, href, created_at
-- It has no actor, so an audit UI built on it could only ever claim "settings
-- updated", never "by whom". This adds the actor and the indexes the list and
-- the filters need.
--
-- Additive and idempotent: safe to run more than once in the SQL Editor.
-- Run this before deploying the audit log UI, so the page can honestly show who.

alter table public.activity_logs add column if not exists actor_id uuid references auth.users(id) on delete set null;
alter table public.activity_logs add column if not exists actor_email text not null default '';
-- 'admin' or 'student': the same log serves both dashboards
alter table public.activity_logs add column if not exists actor_role text not null default 'admin';
-- the entity touched, so a filter can narrow to one record rather than a path
alter table public.activity_logs add column if not exists entity text not null default '';
alter table public.activity_logs add column if not exists entity_id text not null default '';

-- the list is always reverse-chronological, and usually narrowed to one actor
create index if not exists activity_logs_created_idx on public.activity_logs (created_at desc);
create index if not exists activity_logs_actor_idx on public.activity_logs (actor_id, created_at desc);
create index if not exists activity_logs_entity_idx on public.activity_logs (entity, created_at desc);

-- Existing rows predate the actor, so they stay blank rather than being
-- backfilled with a guess. The UI must render "unknown" rather than invent a name.

-- Confirm afterwards:
--   select column_name, data_type from information_schema.columns
--    where table_schema = 'public' and table_name = 'activity_logs'
--    order by ordinal_position;
