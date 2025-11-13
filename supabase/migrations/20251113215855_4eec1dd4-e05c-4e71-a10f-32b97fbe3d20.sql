-- Fix security warning: Set search_path for sync_session_active_status function
CREATE OR REPLACE FUNCTION sync_session_active_status()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automatically set is_active based on session_status
  IF NEW.session_status = 'active' THEN
    NEW.is_active := true;
  ELSIF NEW.session_status IN ('inactive', 'logged_out') THEN
    NEW.is_active := false;
  END IF;
  
  RETURN NEW;
END;
$$;