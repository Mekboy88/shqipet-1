-- ============================================
-- COLUMN-LEVEL SECURITY FIX FOR PROFILES
-- ============================================

-- First, create a view for public profiles with ONLY non-sensitive fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  bio,
  avatar_url,
  cover_url,
  gender,
  created_at,
  updated_at,
  is_hidden
FROM public.profiles
WHERE is_hidden = false;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Add helpful comment
COMMENT ON VIEW public.public_profiles IS 
'Public view of profiles exposing only non-sensitive information (username, bio, avatar, cover). Does not include email, phone_number, first_name, last_name, or date_of_birth.';

-- ============================================
-- Create a security definer function to get full profile safely
-- ============================================
CREATE OR REPLACE FUNCTION public.get_full_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  bio text,
  avatar_url text,
  cover_url text,
  gender text,
  email text,
  phone_number text,
  first_name text,
  last_name text,
  date_of_birth date,
  primary_role text,
  is_hidden boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only return full profile data if:
  -- 1. User is requesting their own profile, OR
  -- 2. User is platform owner or super admin
  SELECT 
    p.id,
    p.username,
    p.bio,
    p.avatar_url,
    p.cover_url,
    p.gender,
    CASE 
      WHEN auth.uid() = p.id OR is_platform_owner(auth.uid()) THEN p.email
      ELSE NULL
    END as email,
    CASE 
      WHEN auth.uid() = p.id OR is_platform_owner(auth.uid()) THEN p.phone_number
      ELSE NULL
    END as phone_number,
    CASE 
      WHEN auth.uid() = p.id OR is_platform_owner(auth.uid()) THEN p.first_name
      ELSE NULL
    END as first_name,
    CASE 
      WHEN auth.uid() = p.id OR is_platform_owner(auth.uid()) THEN p.last_name
      ELSE NULL
    END as last_name,
    CASE 
      WHEN auth.uid() = p.id OR is_platform_owner(auth.uid()) THEN p.date_of_birth
      ELSE NULL
    END as date_of_birth,
    p.primary_role,
    p.is_hidden,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = profile_id;
$$;

COMMENT ON FUNCTION public.get_full_profile IS 
'Security definer function that returns profile data with sensitive fields (email, phone, names, DOB) only visible to the profile owner or platform admins.';

-- ============================================
-- Update RLS policies to be more explicit
-- ============================================

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Users can view their own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profile data of others" ON public.profiles;

-- Policy 1: Users can see their OWN profile with ALL fields
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Platform owners can see all profiles
CREATE POLICY "Platform owners can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_platform_owner(auth.uid()));

-- Policy 3: Others can ONLY see non-sensitive public data (enforced via application)
-- This policy allows row access but applications should use public_profiles view
CREATE POLICY "Users can access other non-hidden profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() <> id 
  AND is_hidden = false
);

-- Add security warning comment
COMMENT ON POLICY "Users can access other non-hidden profiles" ON public.profiles IS 
'SECURITY: This policy grants row access only. Applications MUST use public_profiles view or get_full_profile() function to prevent exposure of sensitive columns (email, phone_number, first_name, last_name, date_of_birth).';

-- ============================================
-- Create helper function for safe profile queries
-- ============================================
CREATE OR REPLACE FUNCTION public.get_safe_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  bio text,
  avatar_url text,
  cover_url text,
  gender text,
  is_hidden boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    username,
    bio,
    avatar_url,
    cover_url,
    gender,
    is_hidden,
    created_at,
    updated_at
  FROM public.profiles
  WHERE id = profile_id
    AND is_hidden = false;
$$;

COMMENT ON FUNCTION public.get_safe_profile IS 
'Returns only non-sensitive profile fields. Safe for displaying other users profiles without exposing PII.';