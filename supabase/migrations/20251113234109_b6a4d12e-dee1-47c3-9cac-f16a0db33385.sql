-- Add missing columns to user_sessions table

-- Add physical_key column for grouping physical devices
ALTER TABLE public.user_sessions
ADD COLUMN IF NOT EXISTS physical_key TEXT;

-- Add device_model column for storing device hardware model
ALTER TABLE public.user_sessions
ADD COLUMN IF NOT EXISTS device_model TEXT;

-- Create index on physical_key for faster grouping queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_physical_key 
ON public.user_sessions(physical_key);

-- Create composite index for user_id + physical_key lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_physical 
ON public.user_sessions(user_id, physical_key);