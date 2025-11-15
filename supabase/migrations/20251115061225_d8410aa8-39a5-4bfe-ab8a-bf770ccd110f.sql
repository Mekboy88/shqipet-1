-- Add denormalized content columns to posts table for better query performance
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS content_text TEXT,
ADD COLUMN IF NOT EXISTS content_images TEXT[];

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_content_text ON public.posts USING gin(to_tsvector('english', content_text));
CREATE INDEX IF NOT EXISTS idx_posts_content_images ON public.posts USING gin(content_images);

-- Add comments explaining these columns
COMMENT ON COLUMN public.posts.content_text IS 'Denormalized text content from content JSONB for faster queries';
COMMENT ON COLUMN public.posts.content_images IS 'Denormalized image URLs from content JSONB for faster queries';

-- Create a function to sync content from JSONB to flat columns
CREATE OR REPLACE FUNCTION sync_post_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract text from content JSONB
  NEW.content_text := NEW.content->>'text';
  
  -- Extract images array from content JSONB
  IF NEW.content ? 'images' THEN
    NEW.content_images := ARRAY(
      SELECT jsonb_array_elements_text(NEW.content->'images')
    );
  ELSE
    NEW.content_images := '{}';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync content on insert/update
DROP TRIGGER IF EXISTS sync_post_content_trigger ON public.posts;
CREATE TRIGGER sync_post_content_trigger
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION sync_post_content();

-- Backfill existing posts with denormalized content
UPDATE public.posts
SET 
  content_text = content->>'text',
  content_images = CASE 
    WHEN content ? 'images' THEN 
      ARRAY(SELECT jsonb_array_elements_text(content->'images'))
    ELSE '{}'::text[]
  END
WHERE content_text IS NULL OR content_images IS NULL;