-- Drop and recreate the trigger to use the updated sync_post_content function
DROP TRIGGER IF EXISTS sync_post_content_trigger ON public.posts;

CREATE TRIGGER sync_post_content_trigger
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION sync_post_content();