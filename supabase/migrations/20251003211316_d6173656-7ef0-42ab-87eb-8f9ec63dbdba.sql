-- Enable realtime for profiles table to sync avatar and cover changes across devices
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;