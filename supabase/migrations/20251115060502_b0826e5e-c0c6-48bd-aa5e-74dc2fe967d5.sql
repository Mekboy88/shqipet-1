-- Create the missing get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.get_user_primary_role(auth.uid());
$$;

-- Add missing columns to posts table that the code is trying to use
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS user_image TEXT;

-- Create an index on user_id for better performance when joining with profiles
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);

-- Add a comment explaining these columns
COMMENT ON COLUMN public.posts.user_name IS 'Denormalized user name for faster post queries';
COMMENT ON COLUMN public.posts.user_image IS 'Denormalized user image URL for faster post queries';