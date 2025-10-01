-- Add gender column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN gender text CHECK (gender IN ('male', 'female'));

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.gender IS 'User gender: male or female';