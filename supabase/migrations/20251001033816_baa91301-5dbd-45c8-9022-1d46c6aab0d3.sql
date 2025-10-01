-- Harden public_profiles view access by revoking direct SELECT
-- and providing controlled access via RPC function only

-- Revoke direct SELECT access from all roles
REVOKE SELECT ON public.public_profiles FROM anon;
REVOKE SELECT ON public.public_profiles FROM authenticated;

-- Create secure RPC function to access public profiles with rate limiting
CREATE OR REPLACE FUNCTION public.get_public_profiles(
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  username text,
  bio text,
  avatar_url text,
  cover_url text,
  gender text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  is_hidden boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enforce maximum page size to prevent abuse
  IF limit_count > 50 THEN
    limit_count := 50;
  END IF;

  -- Optional: Log access for audit trail (uncomment if needed)
  -- INSERT INTO public.profile_access_logs (viewer_id, viewed_profile_id, access_method)
  -- SELECT auth.uid(), pp.id, 'get_public_profiles'
  -- FROM public.public_profiles pp
  -- LIMIT limit_count OFFSET offset_count;

  -- Return only non-sensitive, non-hidden profiles
  RETURN QUERY
  SELECT 
    pp.id,
    pp.username,
    pp.bio,
    pp.avatar_url,
    pp.cover_url,
    pp.gender,
    pp.created_at,
    pp.updated_at,
    pp.is_hidden
  FROM public.public_profiles pp
  WHERE pp.is_hidden = false
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_public_profiles(integer, integer) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.get_public_profiles IS 
'Securely fetches public profile data with rate limiting (max 50 per call). 
Only returns non-hidden profiles and non-sensitive fields. 
Authenticated users only.';