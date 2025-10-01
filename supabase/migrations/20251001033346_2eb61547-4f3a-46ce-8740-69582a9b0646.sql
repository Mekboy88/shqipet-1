-- Fix SECURITY DEFINER view warning by enabling SECURITY INVOKER mode
-- This makes the view execute with the querying user's permissions (respecting RLS)
-- rather than the creator's permissions

ALTER VIEW public.public_profiles SET (security_invoker = on);

-- Verify the view is properly secured
COMMENT ON VIEW public.public_profiles IS 
'SECURITY INVOKER: This view executes with the querying users permissions and respects RLS. 
It exposes only non-sensitive profile data (username, bio, avatar, etc.) and automatically 
filters out hidden profiles. Sensitive PII fields (email, phone, names, DOB) are excluded.
This view is safe to expose via the API as it cannot leak sensitive data.';