-- Create unique index to ensure one session per device per user
CREATE UNIQUE INDEX IF NOT EXISTS ux_user_sessions_user_device
ON public.user_sessions (user_id, device_stable_id);