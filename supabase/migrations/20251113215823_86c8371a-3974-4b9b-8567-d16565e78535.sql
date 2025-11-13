-- Step 1: Create trigger function to auto-sync is_active with session_status
CREATE OR REPLACE FUNCTION sync_session_active_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set is_active based on session_status
  IF NEW.session_status = 'active' THEN
    NEW.is_active := true;
  ELSIF NEW.session_status IN ('inactive', 'logged_out') THEN
    NEW.is_active := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger on user_sessions
DROP TRIGGER IF EXISTS sync_session_active_status_trigger ON user_sessions;
CREATE TRIGGER sync_session_active_status_trigger
  BEFORE INSERT OR UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION sync_session_active_status();

-- Step 3: Backfill existing data to fix inconsistencies
UPDATE user_sessions
SET is_active = (session_status = 'active')
WHERE is_active != (session_status = 'active');

-- Step 4: Add CHECK constraint to prevent future inconsistencies
ALTER TABLE user_sessions
DROP CONSTRAINT IF EXISTS session_status_consistency;

ALTER TABLE user_sessions
ADD CONSTRAINT session_status_consistency 
CHECK (
  (is_active = true AND session_status = 'active') OR
  (is_active = false AND session_status IN ('inactive', 'logged_out'))
);