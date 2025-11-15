-- Enable realtime for user_sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;

-- Ensure DELETE events include full row data
ALTER TABLE public.user_sessions REPLICA IDENTITY FULL;