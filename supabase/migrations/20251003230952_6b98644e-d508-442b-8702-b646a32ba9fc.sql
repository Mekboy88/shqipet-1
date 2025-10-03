-- Phase 1: Critical Security Fixes (Corrected)

-- 1. Fix admin_actions visibility - restrict to admins only
DROP POLICY IF EXISTS "Users can view own related admin actions" ON public.admin_actions;

CREATE POLICY "Only admins and platform owners can view admin actions"
ON public.admin_actions
FOR SELECT
TO authenticated
USING (
  current_user_is_admin() 
  OR is_platform_owner(auth.uid())
);

-- 2. Add explicit policy to prevent any unauthenticated access to profiles
CREATE POLICY "Deny all unauthenticated access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- 3. Add index for performance on user_roles queries (for role fetching optimization)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_active 
ON public.user_roles(user_id, is_active) 
WHERE is_active = true;

-- 4. Note: public_profiles is a VIEW - RLS must be handled via the underlying profiles table
-- The profiles table RLS policies will automatically apply to the view