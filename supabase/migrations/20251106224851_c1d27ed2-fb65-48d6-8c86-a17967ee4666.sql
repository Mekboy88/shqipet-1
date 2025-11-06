-- Add is_anonymous column to posts table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'is_anonymous'
  ) THEN
    ALTER TABLE public.posts 
    ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
    
    COMMENT ON COLUMN public.posts.is_anonymous IS 
    'Indicates if the post is anonymous. When true, user information should be hidden from public view.';
  END IF;
END $$;