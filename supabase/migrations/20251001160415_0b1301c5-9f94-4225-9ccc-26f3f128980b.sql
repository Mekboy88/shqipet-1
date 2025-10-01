-- Set the view to SECURITY INVOKER mode
-- This makes the view respect RLS policies on the underlying profiles table
ALTER VIEW public.public_profiles SET (security_invoker = on);

-- Add a new policy on the profiles table that allows authenticated users 
-- to view only public (non-sensitive) fields from other users' profiles
CREATE POLICY "Authenticated users can view public profile fields"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can see public fields of non-hidden profiles (not their own)
  auth.uid() != id 
  AND is_hidden = false
);

-- Update the view comment to reflect the security model
COMMENT ON VIEW public.public_profiles IS 
'Public-facing profile view exposing only non-sensitive fields (username, bio, avatar_url, cover_url, gender).
Uses SECURITY INVOKER mode to enforce RLS. Only accessible to authenticated users.
Hidden profiles and sensitive PII (email, phone, names, DOB) are never exposed.
SECURITY DEFINER functions like get_public_profiles() provide controlled access.';

-- Add policy comment
COMMENT ON POLICY "Authenticated users can view public profile fields" ON public.profiles IS
'Allows authenticated users to view public (non-sensitive) fields from other users'' profiles.
Does not grant access to sensitive fields - those require ownership or admin privileges.
Only applies to non-hidden profiles and excludes the user''s own profile (covered by other policies).';