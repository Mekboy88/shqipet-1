-- Create security definer function to check if user is platform owner
CREATE OR REPLACE FUNCTION public.is_platform_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND primary_role = 'platform_owner_root'
      AND is_hidden = true
  )
$$;

-- Drop existing RLS policies on profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new RLS policies that protect platform owner
-- Policy 1: Users can only view their own profile, but platform owner is invisible to others
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR (
    -- Allow viewing other profiles only if they are NOT the platform owner
    auth.uid() != id 
    AND is_hidden = false
  )
);

-- Policy 2: Users can only insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can only update their own profile
-- Platform owner can update themselves, others cannot update platform owner
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Prevent deletion of platform owner account
CREATE POLICY "Prevent platform owner deletion"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  auth.uid() = id 
  AND NOT public.is_platform_owner(id)
);

-- Update user_roles table policies to protect platform owner roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR (
    -- Hide platform owner roles from everyone except the platform owner
    role != 'platform_owner_root'
  )
);

-- Prevent any modifications to platform owner role assignments
CREATE POLICY "Prevent platform owner role modifications"
ON public.user_roles
FOR ALL
TO authenticated
USING (role != 'platform_owner_root')
WITH CHECK (role != 'platform_owner_root');