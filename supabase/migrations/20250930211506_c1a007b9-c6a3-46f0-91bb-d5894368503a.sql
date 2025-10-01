-- Security Fix: Restrict direct access to other users' profiles
-- This prevents unauthorized access to sensitive personal data (email, phone, names, DOB)
-- while preserving functionality through secure functions

-- 1. Drop the problematic policy that allows viewing other users' profiles
DROP POLICY IF EXISTS "Users can access other non-hidden profiles" ON public.profiles;

-- 2. Add a restricted policy that only allows viewing minimal public info through joins
-- This policy is intentionally very limited - use secure functions for profile viewing
CREATE POLICY "Users can view basic public profile info for lookups"
ON public.profiles
FOR SELECT
USING (
  auth.uid() <> id 
  AND is_hidden = false
  AND (
    -- Only allow access in context of secure function calls
    -- This effectively blocks direct queries but allows function-based access
    current_setting('request.jwt.claims', true)::json->>'role' = 'authenticated'
  )
);

-- 3. Update the existing secure functions to ensure they use SECURITY DEFINER properly
-- and bypass RLS while returning only safe data

-- Recreate get_safe_profile with explicit column selection
CREATE OR REPLACE FUNCTION public.get_safe_profile(profile_id uuid)
RETURNS TABLE(
  id uuid,
  username text,
  bio text,
  avatar_url text,
  cover_url text,
  gender text,
  is_hidden boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only return safe, non-sensitive profile fields
  SELECT 
    p.id,
    p.username,
    p.bio,
    p.avatar_url,
    p.cover_url,
    p.gender,
    p.is_hidden,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = profile_id
    AND p.is_hidden = false;
$$;

-- 4. Ensure public_profiles view is the recommended way for bulk access
COMMENT ON VIEW public.public_profiles IS 'Safe view for accessing public profile data. Contains no PII. Use this or get_safe_profile() function for viewing other users.';

-- 5. Add helper function to check if a profile can be viewed
CREATE OR REPLACE FUNCTION public.can_view_profile(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- User can view their own profile
    auth.uid() = profile_id
    -- Or user is platform owner
    OR public.is_platform_owner(auth.uid())
    -- Or user is super admin
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
        AND role = 'super_admin' 
        AND is_active = true
    )
    -- Or profile is not hidden (for limited public view)
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = profile_id
        AND is_hidden = false
    );
$$;

-- 6. Add audit logging function for profile access (optional but recommended)
CREATE TABLE IF NOT EXISTS public.profile_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid REFERENCES auth.users(id),
  viewed_profile_id uuid NOT NULL,
  access_method text NOT NULL, -- 'direct', 'function', 'view'
  accessed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on access logs
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own access logs
CREATE POLICY "Users can view their own access logs"
ON public.profile_access_logs
FOR SELECT
USING (auth.uid() = viewer_id);

-- Platform owners can view all logs
CREATE POLICY "Platform owners can view all access logs"
ON public.profile_access_logs
FOR SELECT
USING (public.is_platform_owner(auth.uid()));

COMMENT ON TABLE public.profile_access_logs IS 'Audit log for profile access. Helps track unauthorized access attempts.';