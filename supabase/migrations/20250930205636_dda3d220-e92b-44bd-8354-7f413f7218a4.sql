-- Fix search_path for get_profile_field_access_info function
CREATE OR REPLACE FUNCTION public.get_profile_field_access_info()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'safe_public_fields', ARRAY[
      'id', 'username', 'bio', 'avatar_url', 'cover_url', 
      'gender', 'created_at', 'updated_at', 'is_hidden'
    ],
    'sensitive_fields', ARRAY[
      'email', 'phone_number', 'first_name', 'last_name', 'date_of_birth'
    ],
    'guidance', 'Use public_profiles view or get_safe_profile() function to view other users. Use get_full_profile() or direct table query only for own profile.',
    'documentation', '/SECURITY_IMPLEMENTATION.md'
  );
$$;

COMMENT ON FUNCTION public.get_profile_field_access_info IS 
'Returns metadata about profile field access security. Use this for documentation and validation in application code.';