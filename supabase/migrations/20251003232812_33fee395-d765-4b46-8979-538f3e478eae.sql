-- Phase 1: Fix Database Schema - Add Foreign Key and Indexes

-- Add foreign key constraint from posts.user_id to profiles.id
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON public.posts(is_deleted) WHERE is_deleted = false;