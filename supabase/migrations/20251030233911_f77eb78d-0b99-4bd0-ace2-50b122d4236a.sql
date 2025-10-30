-- =====================================================
-- SECURITY FIX: Restrict post_likes visibility
-- =====================================================
-- Current issue: All authenticated users can see all likes (USING true)
-- Fix: Only show likes on posts the user has access to view

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all likes" ON public.post_likes;

-- Create privacy-respecting policy that only shows likes on accessible posts
CREATE POLICY "Users can view likes on accessible posts"
ON public.post_likes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_likes.post_id
    AND (
      -- User can see likes on public posts
      (posts.visibility = 'public' AND posts.is_deleted = false)
      -- User can see likes on their own posts
      OR posts.user_id = auth.uid()
      -- User can see their own likes
      OR post_likes.user_id = auth.uid()
    )
  )
);

-- Add helpful comment
COMMENT ON POLICY "Users can view likes on accessible posts" ON public.post_likes IS 
'SECURITY: Users can only see likes on posts they have access to (public posts, their own posts, or their own likes). This prevents user behavior profiling and stalking.';