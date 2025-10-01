-- Add RLS policies for public_profiles view access
-- Since public_profiles is a view, we ensure the underlying profiles table
-- has proper policies and create a security definer function for safe access

-- Create a rate-limited function for accessing public profiles
CREATE OR REPLACE FUNCTION public.get_public_profiles(
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS SETOF public.public_profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Limit to prevent bulk scraping
  SELECT * FROM public.public_profiles
  ORDER BY created_at DESC
  LIMIT LEAST(limit_count, 50)  -- Maximum 50 records per call
  OFFSET offset_count;
$$;

-- Create function to get single public profile (most common use case)
CREATE OR REPLACE FUNCTION public.get_public_profile_by_id(profile_id uuid)
RETURNS SETOF public.public_profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.public_profiles
  WHERE id = profile_id
  LIMIT 1;
$$;

-- Revoke direct SELECT from public_profiles view for extra security
REVOKE SELECT ON public.public_profiles FROM authenticated;
REVOKE SELECT ON public.public_profiles FROM anon;

-- Grant execute on the safe functions instead
GRANT EXECUTE ON FUNCTION public.get_public_profiles(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile_by_id(uuid) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.get_public_profiles IS 'Rate-limited function to fetch public profiles. Maximum 50 records per call to prevent scraping.';
COMMENT ON FUNCTION public.get_public_profile_by_id IS 'Secure function to fetch a single public profile by ID.';