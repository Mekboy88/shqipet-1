-- Add user_photos to realtime publication to get avatar/cover gallery updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_photos;