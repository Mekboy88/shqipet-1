-- Switch public_profiles to SECURITY INVOKER mode to satisfy linter
-- This makes the view respect the querying user's RLS policies
ALTER VIEW public.public_profiles SET (security_invoker = on);

-- IMPORTANT: This change means the view will now be restricted by the RLS policies
-- on the profiles table. Since we only have policies allowing users to see their own
-- profile or profiles they're admins for, the view will be VERY restricted.
-- 
-- The existing GRANT statements still apply (anonymous blocked, authenticated allowed),
-- but now RLS also applies on top of that.
--
-- Application code MUST use the SECURITY DEFINER functions (get_public_profiles, 
-- get_safe_profile) which bypass these restrictions safely.

COMMENT ON VIEW public.public_profiles IS 
'Public profile view exposing only non-sensitive fields. Uses SECURITY INVOKER mode.\n'
'Access controlled by: 1) GRANTs (anon blocked, authenticated allowed) AND 2) RLS on profiles table.\n'
'Direct queries will be highly restricted. Use SECURITY DEFINER functions for proper access:\n'
'  - get_public_profiles(): paginated list of public profiles\n'
'  - get_safe_profile(): single profile by ID\n'
'These functions safely expose only non-sensitive fields with authentication required.';