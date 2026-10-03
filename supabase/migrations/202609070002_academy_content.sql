-- Academy content: student work, and newsletter signups.
-- Safe to run more than once in the Supabase SQL Editor.

-- Student work is its own content, deliberately separate from public.videos.
-- Those rows are client commissions; showing them as student output would be an
-- untrue claim. The consent column is enforced by a constraint, not by politeness:
-- a row cannot be published without it.
create table if not exists public.student_work (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  student_name text not null,
  course_id uuid references public.courses(id) on delete set null,
  course_title text not null default '',
  note text not null default '',
  media_url text not null default '',
  poster_url text not null default '',
  status text not null default 'draft',
  consent boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_work drop constraint if exists student_work_status_check;
alter table public.student_work add constraint student_work_status_check check (status in ('draft','published'));
-- the boundary, enforced by the database rather than by remembering
alter table public.student_work drop constraint if exists student_work_consent_required;
alter table public.student_work add constraint student_work_consent_required check (status <> 'published' or consent);

create index if not exists student_work_status_idx on public.student_work (status, display_order);
create index if not exists student_work_course_idx on public.student_work (course_id);

-- Newsletter signups from the Academy footer and course pages.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'academy',
  created_at timestamptz not null default now()
);

alter table public.student_work enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- only published work is readable without a session, so a draft cannot leak
drop policy if exists "published student work is public" on public.student_work;
create policy "published student work is public" on public.student_work for select using (status = 'published');
drop policy if exists "admins manage student work" on public.student_work;
create policy "admins manage student work" on public.student_work for all using (public.is_admin()) with check (public.is_admin());

-- anyone may subscribe; nobody may read the list except an admin
drop policy if exists "anyone may subscribe" on public.newsletter_subscribers;
create policy "anyone may subscribe" on public.newsletter_subscribers for insert with check (true);
drop policy if exists "admins read subscribers" on public.newsletter_subscribers;
create policy "admins read subscribers" on public.newsletter_subscribers for select using (public.is_admin());

-- Confirm afterwards:
--   select table_name from information_schema.tables
--    where table_schema = 'public' and table_name in ('student_work','newsletter_subscribers');
