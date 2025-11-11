-- Realtime for profile media (avatars, covers)
-- Ensure full row data is available for realtime diffs
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.user_photos REPLICA IDENTITY FULL;

-- Add tables to realtime publication (idempotent)
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.user_photos';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;