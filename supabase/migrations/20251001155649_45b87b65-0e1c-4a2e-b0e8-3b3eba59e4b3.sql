-- Enable Row Level Security on public_profiles view
ALTER VIEW public.public_profiles SET (security_invoker = on);

-- Create RLS policy to allow only authenticated users to view public profiles
CREATE POLICY "Authenticated users can view public profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  is_hidden = false 
  AND id IN (
    SELECT id FROM public.public_profiles
  )
);

-- Add a comment explaining the security model
COMMENT ON VIEW public.public_profiles IS 
'Public-facing profile view that exposes only non-sensitive fields. 
Access requires authentication to prevent anonymous data harvesting.
Only non-hidden profiles are included.';