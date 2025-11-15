-- Add unique index to prevent duplicate sessions per user+device
CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_user_device_unique 
ON public.user_sessions (user_id, device_stable_id);