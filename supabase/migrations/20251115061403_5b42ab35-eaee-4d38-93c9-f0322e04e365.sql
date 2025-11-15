-- Fix security issue: Add search_path to sync_post_content function
CREATE OR REPLACE FUNCTION sync_post_content()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;