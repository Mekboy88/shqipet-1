-- Add active_tabs_count to track how many browser windows/tabs are open on this device
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS active_tabs_count INTEGER NOT NULL DEFAULT 1;