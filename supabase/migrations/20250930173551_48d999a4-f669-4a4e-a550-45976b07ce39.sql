-- Drop the overly permissive policy that exposes all user data publicly
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a restrictive policy: users can ONLY view their own complete profile
-- This protects sensitive data like email addresses and full names
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);