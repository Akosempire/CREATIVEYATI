-- Certificates of completion plus public verification.
-- Safe to run more than once in the Supabase SQL Editor.

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  serial text not null unique,
  student_name text not null default '',
  course_title text not null default '',
  lesson_count integer not null default 0 check (lesson_count >= 0),
  instruction_minutes integer not null default 0 check (instruction_minutes >= 0),
  grade text not null default 'Completed',
  status text not null default 'valid',
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.certificates drop constraint if exists certificates_status_check;
alter table public.certificates add constraint certificates_status_check check (status in ('valid','revoked'));
-- one certificate per student per course, which is what makes issuance idempotent
alter table public.certificates drop constraint if exists certificates_student_course_key;
alter table public.certificates add constraint certificates_student_course_key unique (student_id, course_id);

create index if not exists certificates_serial_idx on public.certificates(serial);
create index if not exists certificates_student_idx on public.certificates(student_id, issued_at desc);
create index if not exists certificates_course_idx on public.certificates(course_id, issued_at desc);

-- serials are IDY-<year>-<6 hex> from a sequence, so they stay unique and ordered
-- without parsing previously issued rows
create sequence if not exists public.certificate_serial_seq;

create or replace function public.next_certificate_serial()
returns text language sql volatile set search_path = public as $$
  select 'IDY-' || to_char(now(), 'YYYY') || '-' || upper(lpad(to_hex(nextval('public.certificate_serial_seq')), 6, '0'));
$$;

-- students read their own rows and admins manage every row; the public
-- verification page reads through the service role on the server, so no anon policy
alter table public.certificates enable row level security;
drop policy if exists "students read own certificates" on public.certificates;
create policy "students read own certificates" on public.certificates for select using (auth.uid() = student_id);
drop policy if exists "admins manage certificates" on public.certificates;
create policy "admins manage certificates" on public.certificates for all using (public.is_admin()) with check (public.is_admin());

-- one-time backfill. issuance only runs when a lesson is marked complete, so
-- students who finished a course before this migration would never be credited.
-- only rows with every published lesson completed are inserted, and the unique
-- constraint means re-running changes nothing.
with published as (
  select course_id, count(*)::int as lessons, coalesce(sum(duration_seconds), 0)::int as seconds
  from public.course_lessons
  where status = 'published'
  group by course_id
),
finished as (
  select lesson.course_id, progress.student_id, count(*)::int as done
  from public.lesson_progress progress
  join public.course_lessons lesson on lesson.id = progress.lesson_id
  where progress.completed = true and lesson.status = 'published'
  group by lesson.course_id, progress.student_id
)
insert into public.certificates (student_id, course_id, serial, student_name, course_title, lesson_count, instruction_minutes)
select finished.student_id, finished.course_id, public.next_certificate_serial(),
       coalesce(profile.full_name, account.email, ''), course.title, published.lessons,
       round(published.seconds / 60.0)::int
from finished
join published on published.course_id = finished.course_id
join public.courses course on course.id = finished.course_id
left join public.student_profiles profile on profile.id = finished.student_id
left join auth.users account on account.id = finished.student_id
left join public.certificates existing on existing.student_id = finished.student_id and existing.course_id = finished.course_id
where finished.done >= published.lessons and published.lessons > 0 and existing.id is null
on conflict (student_id, course_id) do nothing;
