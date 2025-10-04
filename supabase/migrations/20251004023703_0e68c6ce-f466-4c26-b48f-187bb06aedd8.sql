-- Add edit_mode column to professional_presentations table
-- This will store whether the user has edit mode enabled or not

ALTER TABLE public.professional_presentations
ADD COLUMN IF NOT EXISTS edit_mode boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.professional_presentations.edit_mode 
IS 'Stores the user preference for edit mode. Default is false (off). Persists across page refreshes.';