-- =====================================================
-- SECURITY FIX: Ensure all functions have immutable search_path
-- =====================================================
-- This prevents schema hijacking attacks on SECURITY DEFINER functions

-- Fix any functions that might be missing search_path
-- Re-create critical functions with proper search_path if needed

-- Ensure set_updated_at has search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Ensure update_professional_presentations_timestamp has search_path
CREATE OR REPLACE FUNCTION public.update_professional_presentations_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Ensure update_cost_tracking_timestamp has search_path
CREATE OR REPLACE FUNCTION public.update_cost_tracking_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Ensure handle_updated_at has search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Ensure update_post_counts has search_path
CREATE OR REPLACE FUNCTION public.update_post_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'post_likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'post_comments' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'post_shares' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.posts SET shares_count = GREATEST(shares_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Ensure sync_primary_role has search_path
CREATE OR REPLACE FUNCTION public.sync_primary_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the profiles table with the highest role
  UPDATE public.profiles
  SET primary_role = public.get_user_primary_role(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.user_id
      ELSE NEW.user_id
    END
  )
  WHERE id = CASE 
    WHEN TG_OP = 'DELETE' THEN OLD.user_id
    ELSE NEW.user_id
  END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Ensure handle_new_user has search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone_number, username, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.phone,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

-- Add comments for security documentation
COMMENT ON FUNCTION public.set_updated_at() IS 'SECURITY: SET search_path prevents schema hijacking';
COMMENT ON FUNCTION public.update_professional_presentations_timestamp() IS 'SECURITY: SET search_path prevents schema hijacking';
COMMENT ON FUNCTION public.update_cost_tracking_timestamp() IS 'SECURITY: SET search_path prevents schema hijacking';
COMMENT ON FUNCTION public.handle_updated_at() IS 'SECURITY: SET search_path prevents schema hijacking';
COMMENT ON FUNCTION public.update_post_counts() IS 'SECURITY: SET search_path prevents schema hijacking';
COMMENT ON FUNCTION public.sync_primary_role() IS 'SECURITY: SET search_path prevents schema hijacking';
COMMENT ON FUNCTION public.handle_new_user() IS 'SECURITY: SET search_path prevents schema hijacking';