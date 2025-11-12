-- Fix security warning: Set search_path for update_user_sessions_timestamp function
-- Drop trigger first
DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON public.user_sessions;

-- Drop function
DROP FUNCTION IF EXISTS update_user_sessions_timestamp();

-- Recreate function with secure search_path
CREATE OR REPLACE FUNCTION update_user_sessions_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_sessions_timestamp();