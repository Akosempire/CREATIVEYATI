-- Apply after provisioning a Supabase Auth user in public.admin_users.
-- This closes direct Data API access at AAL1 as well as the application guard.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((auth.jwt() ->> 'aal') = 'aal2', false)
    and exists(select 1 from public.admin_users where id = auth.uid());
$$;

-- Replace the original policies that checked membership directly.
alter policy "admins manage all" on public.videos using (public.is_admin()) with check (public.is_admin());
alter policy "admins manage categories" on public.categories using (public.is_admin()) with check (public.is_admin());
alter policy "admins manage enquiries" on public.enquiries using (public.is_admin()) with check (public.is_admin());
alter policy "admins manage content" on public.site_content using (public.is_admin()) with check (public.is_admin());
alter policy "admins manage settings" on public.site_settings using (public.is_admin()) with check (public.is_admin());
alter policy "admins read logs" on public.activity_logs using (public.is_admin());
