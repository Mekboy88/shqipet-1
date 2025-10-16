-- Enable realtime for notification_preferences
ALTER TABLE public.notification_preferences REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_preferences;