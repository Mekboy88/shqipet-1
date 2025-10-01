-- Drop the policy that allows users to view other users' profiles
DROP POLICY IF EXISTS "Users can view basic public profile info for lookups" ON public.profiles;

-- Add policy for admins to view all profiles (super_admin and admin roles)
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = true
  )
);

-- For public_profiles view: Revoke public access and grant only to authenticated users
REVOKE ALL ON public.public_profiles FROM PUBLIC;
REVOKE ALL ON public.public_profiles FROM anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Strengthen the update policy to prevent users from changing their role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add policy for admins to update any profile
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = true
  )
);

-- Add policy for admins to view all user roles
CREATE POLICY "Admins can view all user roles" ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
      AND ur.is_active = true
  )
);