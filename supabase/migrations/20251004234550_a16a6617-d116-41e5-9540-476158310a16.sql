-- Add photo_text_transform column for storing text block position
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS photo_text_transform JSONB DEFAULT '{"translateX": 0, "translateY": 0}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN profiles.photo_text_transform IS 'Stores the text block transformation data including translateX and translateY for the professional presentation text section';