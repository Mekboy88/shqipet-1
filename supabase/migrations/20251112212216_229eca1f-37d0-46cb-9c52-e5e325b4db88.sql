-- Enable full replica identity for user_sessions to capture all column changes in real-time
ALTER TABLE public.user_sessions REPLICA IDENTITY FULL;