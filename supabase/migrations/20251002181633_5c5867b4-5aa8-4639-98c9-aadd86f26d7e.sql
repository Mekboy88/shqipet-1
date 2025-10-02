-- Add cover_position and cover_gradient columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_position TEXT,
ADD COLUMN IF NOT EXISTS cover_gradient TEXT;

-- Add updated_at trigger to profiles table (optional but cleaner)
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();