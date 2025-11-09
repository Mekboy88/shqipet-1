-- Add column to control cover photo buttons visibility
ALTER TABLE public.profiles 
ADD COLUMN show_cover_controls boolean DEFAULT true;

COMMENT ON COLUMN public.profiles.show_cover_controls IS 'Controls visibility of cover photo editing buttons on profile page';
