-- Fix RLS policies for public_profiles view
-- Views cannot have RLS policies directly, but we can ensure the underlying table policies are correct

-- Drop and recreate public_profiles view with better security
DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  bio,
  avatar_url,
  cover_url,
  gender,
  created_at,
  updated_at,
  is_hidden
FROM public.profiles
WHERE is_hidden = false;

-- Grant select permission only to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

COMMENT ON VIEW public.public_profiles IS 
'Public view of non-sensitive profile data. Only shows non-hidden profiles. Access controlled by underlying profiles table RLS policies.';