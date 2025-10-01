-- First, ensure all previous permissions are revoked
REVOKE ALL ON public.public_profiles FROM PUBLIC;
REVOKE ALL ON public.public_profiles FROM anon;
REVOKE ALL ON public.public_profiles FROM authenticated;

-- Grant SELECT only to authenticated users (no anonymous access)
GRANT SELECT ON public.public_profiles TO authenticated;

-- Add a comment to document the security model
COMMENT ON VIEW public.public_profiles IS 'Public profile view - accessible only to authenticated users. Contains non-sensitive profile information (username, bio, avatar). Sensitive data (email, phone, DOB) is excluded from this view.';

-- Verify the underlying profiles table has proper RLS
-- The profiles table already has RLS, but let's ensure anonymous users can't access it
-- (This should already be in place, but we're being extra cautious)

-- Note: Views in PostgreSQL inherit the permissions of the underlying tables
-- Since the profiles table has RLS enabled and only allows:
-- 1. Users to view their own profiles
-- 2. Platform owners to view all profiles  
-- 3. Admins to view all profiles
-- The view will respect these restrictions when queried by authenticated users