-- Remove the dangerous policy that exposes sensitive profile data
DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.profiles;

-- Revert the security_invoker setting on the view
ALTER VIEW public.public_profiles SET (security_invoker = off);

-- Update the view comment to clarify the security model
COMMENT ON VIEW public.public_profiles IS 
'Public-facing profile view that exposes only non-sensitive fields (username, bio, avatar_url, cover_url, gender).
This view should ONLY be accessed through the get_public_profiles() or get_safe_profile() SECURITY DEFINER functions.
Direct queries to profiles table are blocked by RLS - only users can see their own full profile.
Sensitive fields (email, phone_number, first_name, last_name, date_of_birth) are never exposed through this view.';