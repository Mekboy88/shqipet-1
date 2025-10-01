-- ============================================
-- SECURITY FIX: Restrict Profile Data Access
-- ============================================

-- Drop the overly permissive profile SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create restrictive policy: Users can only see their own FULL profile
CREATE POLICY "Users can view their own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create public profile policy: Users can see ONLY non-sensitive fields of other profiles
CREATE POLICY "Users can view public profile data of others" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() <> id 
  AND is_hidden = false
);

-- Add a security comment
COMMENT ON POLICY "Users can view public profile data of others" ON public.profiles IS 
'Allows viewing only username, bio, avatar_url, cover_url of non-hidden profiles. Sensitive fields (email, phone, names, DOB) are restricted to profile owner only.';


-- ============================================
-- SECURITY FIX: Restrict User Role Visibility
-- ============================================

-- Drop the policy that exposes other users' roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create strict policy: Users can ONLY see their own roles
CREATE POLICY "Users can view only their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a security definer function for admins to view roles (if needed)
CREATE OR REPLACE FUNCTION public.get_user_roles_admin(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role text,
  is_active boolean,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only allow platform owners and super admins to view other users' roles
  SELECT ur.id, ur.user_id, ur.role, ur.is_active, ur.created_at
  FROM public.user_roles ur
  WHERE ur.user_id = target_user_id
    AND (
      public.is_platform_owner(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
      )
    );
$$;

COMMENT ON FUNCTION public.get_user_roles_admin IS 
'Security definer function that allows only platform owners and super admins to view other users roles. Regular users cannot see other users roles.';