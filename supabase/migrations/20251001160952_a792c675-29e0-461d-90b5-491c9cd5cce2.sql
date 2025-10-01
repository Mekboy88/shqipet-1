-- Tighten access: block direct reads of public_profiles by clients
REVOKE SELECT ON public.public_profiles FROM authenticated;
REVOKE ALL ON public.public_profiles FROM PUBLIC;
REVOKE ALL ON public.public_profiles FROM anon;

-- Keep usage limited to SECURITY DEFINER functions only
-- No explicit GRANTs are needed; the view owner retains SELECT privileges

COMMENT ON VIEW public.public_profiles IS 
'SECURE: Direct access disabled for client roles (anon, authenticated).\n'
'Use SECURITY DEFINER functions get_public_profiles() and get_safe_profile() for controlled, authenticated access.\n'
'Only non-sensitive fields are exposed; sensitive PII remains protected by RLS on profiles.';