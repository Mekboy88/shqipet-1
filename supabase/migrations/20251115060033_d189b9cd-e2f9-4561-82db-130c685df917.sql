-- Add missing profile fields that the form is trying to save
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS about_me TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS school TEXT,
ADD COLUMN IF NOT EXISTS school_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS working_at TEXT,
ADD COLUMN IF NOT EXISTS city_location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.about_me IS 'User biography/about me section';
COMMENT ON COLUMN public.profiles.location IS 'User current location';
COMMENT ON COLUMN public.profiles.school IS 'User school or university';
COMMENT ON COLUMN public.profiles.school_completed IS 'Whether user has completed their education';
COMMENT ON COLUMN public.profiles.working_at IS 'User current workplace';
COMMENT ON COLUMN public.profiles.city_location IS 'City where user lives';
COMMENT ON COLUMN public.profiles.website IS 'User personal website URL';