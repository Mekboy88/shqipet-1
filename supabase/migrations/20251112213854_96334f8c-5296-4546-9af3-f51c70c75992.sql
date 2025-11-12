-- Add device_type_locked field to user_sessions table
-- This field ensures device type remains consistent across logins
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS device_type_locked BOOLEAN DEFAULT false;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_locked ON user_sessions(user_id, device_type_locked);

COMMENT ON COLUMN user_sessions.device_type_locked IS 'When true, device type is locked and will not be re-detected on subsequent logins';