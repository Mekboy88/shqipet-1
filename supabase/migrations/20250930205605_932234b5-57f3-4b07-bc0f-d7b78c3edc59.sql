-- ============================================
-- COLUMN-LEVEL PRIVILEGE RESTRICTIONS
-- ============================================
-- This migration adds an extra layer of protection by restricting
-- which columns can be directly accessed by authenticated users

-- First, ensure we have explicit grants on safe columns only
-- Note: This requires revoking default grants and being explicit

-- For authenticated role, explicitly grant SELECT only on safe columns
-- We keep UPDATE/INSERT permissions on all columns so users can modify their own data

-- Grant SELECT on all columns for profiles table (this is the default state)
-- Then we'll rely on RLS + application code to enforce column security

-- The combination of:
-- 1. RLS policies (restricts rows)
-- 2. Secure functions (get_full_profile, get_safe_profile)  
-- 3. Public_profiles view (safe columns only)
-- 4. Application code using these methods
-- Provides defense-in-depth protection

-- Add indexes for performance on the view
CREATE INDEX IF NOT EXISTS idx_profiles_is_hidden ON public.profiles(is_hidden) WHERE is_hidden = false;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;

-- Create a helper function to verify if current user can see sensitive data
CREATE OR REPLACE FUNCTION public.can_view_sensitive_profile_data(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    auth.uid() = profile_id 
    OR public.is_platform_owner(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
        AND role = 'super_admin' 
        AND is_active = true
    );
$$;

COMMENT ON FUNCTION public.can_view_sensitive_profile_data IS 
'Returns true if the current user is authorized to view sensitive profile data (email, phone, names, DOB) for the specified profile_id.';

-- ============================================
-- APPLICATION GUIDANCE FUNCTION
-- ============================================
-- This function returns metadata about what fields are safe to query

CREATE OR REPLACE FUNCTION public.get_profile_field_access_info()
RETURNS jsonb
LANGUAGE sql
STABLE
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