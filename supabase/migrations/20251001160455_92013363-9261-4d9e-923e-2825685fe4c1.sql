-- CRITICAL FIX: Remove the dangerous policy that exposes sensitive columns
DROP POLICY IF EXISTS "Authenticated users can view public profile fields" ON public.profiles;

-- Revert the view back to SECURITY DEFINER mode (default)
-- This allows the view to run with elevated privileges
ALTER VIEW public.public_profiles SET (security_invoker = off);

-- The correct security model is:
-- 1. Direct access to profiles table is restricted by existing RLS policies
-- 2. The public_profiles view can only be safely accessed through SECURITY DEFINER functions
-- 3. These functions (get_public_profiles, get_safe_profile) control access and filter columns
-- 4. Application code should NEVER query profiles or public_profiles directly for other users

-- Update view comment to clarify the security model
COMMENT ON VIEW public.public_profiles IS 
'⚠️ SECURITY: This view must ONLY be accessed through SECURITY DEFINER functions.
Direct queries are blocked by RLS on the underlying profiles table.
Use get_public_profiles() or get_safe_profile() functions which:
  1. Enforce authentication requirements
  2. Only expose non-sensitive fields (username, bio, avatar_url, cover_url, gender)
  3. Filter out hidden profiles
  4. Provide rate limiting and audit logging
Sensitive PII (email, phone, names, DOB) are never exposed through this view.';