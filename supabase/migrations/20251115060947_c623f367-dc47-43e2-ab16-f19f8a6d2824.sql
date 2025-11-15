-- Add user_verified column to posts table for denormalized user verification status
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS user_verified BOOLEAN DEFAULT false;

-- Create an index for better performance when filtering by verified users
CREATE INDEX IF NOT EXISTS idx_posts_user_verified ON public.posts(user_verified) WHERE user_verified = true;

-- Add a comment explaining this column
COMMENT ON COLUMN public.posts.user_verified IS 'Denormalized user verified status for faster post queries';
