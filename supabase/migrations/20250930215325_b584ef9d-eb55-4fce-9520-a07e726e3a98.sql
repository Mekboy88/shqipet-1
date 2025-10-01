-- Drop the view and all dependent objects, then recreate with security
DROP VIEW IF EXISTS public.public_profiles CASCADE;

-- Recreate public_profiles view with built-in security filtering
CREATE VIEW public.public_profiles AS
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
WHERE is_hidden = false OR is_hidden IS NULL;

-- Grant SELECT only to authenticated users (not anonymous)
GRANT SELECT ON public.public_profiles TO authenticated;
REVOKE ALL ON public.public_profiles FROM anon;

-- Recreate the get_public_profiles function with rate limiting
CREATE OR REPLACE FUNCTION public.get_public_profiles(limit_count integer DEFAULT 20, offset_count integer DEFAULT 0)
RETURNS SETOF public.public_profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Limit to prevent bulk scraping
  SELECT * FROM public.public_profiles
  ORDER BY created_at DESC
  LIMIT LEAST(limit_count, 50)  -- Maximum 50 records per call
  OFFSET offset_count;
$$;

-- Recreate the get_public_profile_by_id function
CREATE OR REPLACE FUNCTION public.get_public_profile_by_id(profile_id uuid)
RETURNS SETOF public.public_profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.public_profiles
  WHERE id = profile_id
  LIMIT 1;
$$;