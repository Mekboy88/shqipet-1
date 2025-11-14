-- Ensure unique constraint (user_id, device_stable_id) exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'user_sessions_user_id_device_stable_id_key'
      AND t.relname = 'user_sessions'
  ) THEN
    ALTER TABLE public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_device_stable_id_key UNIQUE (user_id, device_stable_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies idempotently
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_sessions' AND policyname='Users can view own sessions') THEN
    DROP POLICY "Users can view own sessions" ON public.user_sessions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_sessions' AND policyname='Admins can view all sessions') THEN
    DROP POLICY "Admins can view all sessions" ON public.user_sessions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_sessions' AND policyname='Users can manage own sessions') THEN
    DROP POLICY "Users can manage own sessions" ON public.user_sessions;
  END IF;
END $$;

CREATE POLICY "Users can view own sessions"
ON public.user_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
ON public.user_sessions
FOR SELECT
USING (is_platform_owner(auth.uid()) OR current_user_is_admin());

CREATE POLICY "Users can manage own sessions"
ON public.user_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Attach triggers for timestamps, active status sync and trust score
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_sessions_updated_at'
  ) THEN
    CREATE TRIGGER trg_user_sessions_updated_at
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_sessions_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_sessions_sync_active'
  ) THEN
    CREATE TRIGGER trg_user_sessions_sync_active
    BEFORE INSERT OR UPDATE ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_session_active_status();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_sessions_trust_score'
  ) THEN
    CREATE TRIGGER trg_user_sessions_trust_score
    BEFORE INSERT OR UPDATE ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_session_trust_score();
  END IF;
END $$;

-- Realtime: ensure replica identity full and publication membership
ALTER TABLE public.user_sessions REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_sessions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions';
  END IF;
END $$;

-- Helpful index for queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON public.user_sessions (user_id, is_active);
