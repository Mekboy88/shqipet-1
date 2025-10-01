-- Restrict direct access to the public_profiles view to block anonymous scraping
-- Remove any broad/public grants
REVOKE ALL ON public.public_profiles FROM PUBLIC;

-- Explicitly deny anonymous role
REVOKE ALL ON public.public_profiles FROM anon;

-- Allow only authenticated users and service role to read the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO service_role;

-- Document why we use GRANTs instead of RLS here
COMMENT ON VIEW public.public_profiles IS 
'Public profile view exposing only non-sensitive fields. Views do not support RLS; access is controlled via GRANTs.\n'
'Anonymous role has no access. Only authenticated users and service role may SELECT.\n'
'For stricter control and rate limiting, use SECURITY DEFINER functions: get_public_profiles(), get_safe_profile().';