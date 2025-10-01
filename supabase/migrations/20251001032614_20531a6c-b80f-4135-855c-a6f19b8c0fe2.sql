-- Fix infinite recursion in user_roles RLS policies
-- Drop existing problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view only their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Prevent platform owner role modifications" ON public.user_roles;

-- Create security definer functions to check user roles without triggering RLS
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
  );
$$;

-- Recreate RLS policies using security definer functions (no recursion)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.current_user_is_admin());

CREATE POLICY "Prevent platform owner modifications"
ON public.user_roles
FOR ALL
TO authenticated
USING (role <> 'platform_owner_root')
WITH CHECK (role <> 'platform_owner_root');

CREATE POLICY "Super admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.current_user_is_super_admin() AND role <> 'platform_owner_root')
WITH CHECK (public.current_user_is_super_admin() AND role <> 'platform_owner_root');