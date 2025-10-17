-- Critical fix for mobile avatar loading & realtime sync
-- 1) Ensure full row replication for mobile clients
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.user_photos REPLICA IDENTITY FULL;

-- 2) Ensure updated_at changes on UPDATE so cache-busting works
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profiles_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_profiles_set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_photos_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_user_photos_set_updated_at
    BEFORE UPDATE ON public.user_photos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;