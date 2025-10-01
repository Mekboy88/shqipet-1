-- Add is_hidden column to profiles table to hide system/platform users from admin views
ALTER TABLE public.profiles 
ADD COLUMN is_hidden boolean DEFAULT false;

COMMENT ON COLUMN public.profiles.is_hidden IS 'Hide user from admin user management interface';

-- Create index for faster filtering
CREATE INDEX idx_profiles_is_hidden ON public.profiles(is_hidden) WHERE is_hidden = false;