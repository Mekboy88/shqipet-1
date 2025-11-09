-- Add columns to store multiple image sizes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_sizes JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS cover_sizes JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.avatar_sizes IS 'Stores multiple avatar sizes: {"thumbnail": "key", "small": "key", "medium": "key", "large": "key", "original": "key"}';
COMMENT ON COLUMN public.profiles.cover_sizes IS 'Stores multiple cover sizes: {"thumbnail": "key", "small": "key", "medium": "key", "large": "key", "original": "key"}';