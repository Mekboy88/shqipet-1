-- Update get_public_profiles to require authentication
CREATE OR REPLACE FUNCTION public.get_public_profiles(limit_count integer DEFAULT 20, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, username text, bio text, avatar_url text, cover_url text, gender text, created_at timestamp with time zone, updated_at timestamp with time zone, is_hidden boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- SECURITY: Require authentication to prevent anonymous data scraping
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to view public profiles';
  END IF;

  -- Enforce maximum page size to prevent abuse
  IF limit_count > 50 THEN
    limit_count := 50;
  END IF;

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
$function$;

-- Update get_safe_profile to require authentication
CREATE OR REPLACE FUNCTION public.get_safe_profile(profile_id uuid)
 RETURNS TABLE(id uuid, username text, bio text, avatar_url text, cover_url text, gender text, is_hidden boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- SECURITY: Require authentication to prevent anonymous data scraping
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to view profiles';
  END IF;

  -- Only return safe, non-sensitive profile fields
  RETURN QUERY
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
END;
$function$;

-- Add security comments
COMMENT ON FUNCTION public.get_public_profiles IS 
'Returns public profile data with authentication required.
Prevents anonymous scraping while allowing authenticated users to view non-sensitive profile information.';

COMMENT ON FUNCTION public.get_safe_profile IS 
'Returns a single public profile with authentication required.
Only exposes non-sensitive fields. Sensitive PII remains protected.';