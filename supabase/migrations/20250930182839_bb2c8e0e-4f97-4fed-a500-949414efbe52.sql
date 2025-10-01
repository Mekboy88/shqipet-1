-- Add date_of_birth and bio columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN date_of_birth date,
ADD COLUMN bio text CHECK (length(bio) <= 500);

-- Add comments to document the columns
COMMENT ON COLUMN public.profiles.date_of_birth IS 'User date of birth';
COMMENT ON COLUMN public.profiles.bio IS 'User biography/description (max 500 characters)';