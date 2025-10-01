-- Drop existing view
DROP VIEW IF EXISTS public.public_profiles CASCADE;

-- Recreate the view with security barrier to ensure RLS on underlying table is enforced
CREATE VIEW public.public_profiles 
WITH (security_barrier = true)
AS
SELECT 
  id,
  username,
  bio,
  avatar_url,
  cover_url,
  gender,
  is_hidden,
  created_at,
  updated_at
FROM public.profiles
WHERE is_hidden = false;

-- Revoke all public access to the view
REVOKE ALL ON public.public_profiles FROM PUBLIC;
REVOKE ALL ON public.public_profiles FROM anon;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.public_profiles IS 'Secure view of public profile data. Only non-sensitive fields are exposed and hidden profiles are filtered out. Access restricted to authenticated users only. For programmatic access, use get_public_profiles() or get_public_profile_by_id() functions.';