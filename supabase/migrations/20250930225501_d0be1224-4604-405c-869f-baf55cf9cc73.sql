-- Secure DB-side admin access validation
create or replace function public.validate_admin_access(required_action text default 'access_admin_portal')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_platform_owner(auth.uid())
    or exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and is_active = true
        and role in ('super_admin','admin')
    );
$$;