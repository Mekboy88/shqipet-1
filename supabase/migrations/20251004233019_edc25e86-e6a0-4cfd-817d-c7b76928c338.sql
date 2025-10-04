-- Add photo_transform column to profiles table for storing photo position and scale
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS photo_transform JSONB DEFAULT '{"scale": 1, "translateX": 0, "translateY": 0}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN profiles.photo_transform IS 'Stores the photo transformation data including scale, translateX, and translateY for the professional presentation photo';