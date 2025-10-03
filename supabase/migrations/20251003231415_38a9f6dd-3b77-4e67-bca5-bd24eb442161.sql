-- Phase 2: Fix public_profiles View Security Issue

-- 1. Drop the insecure view
DROP VIEW IF EXISTS public.public_profiles;

-- 2. The existing get_public_profiles() and get_safe_profile() functions 
--    already provide secure access with proper authentication checks
--    No additional changes needed - they query the profiles table directly

-- 3. Add RPC grant for authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_safe_profile TO authenticated;