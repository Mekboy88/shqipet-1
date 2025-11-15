-- =====================================================
-- COMPLETE SESSION SYSTEM: REALTIME + UNIQUENESS + CLEANUP
-- =====================================================
-- Purpose: Ensure instant remote logout everywhere, one card per device,
--          accurate tab counting, and realtime updates across entire app
-- =====================================================

-- 1) Ensure full row data is available for realtime diffs (esp. DELETE)
ALTER TABLE public.user_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.session_revocations REPLICA IDENTITY FULL;

-- 2) Add tables to realtime publication (idempotent)
DO $$
BEGIN
  -- Add user_sessions to publication
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- Add session_revocations to publication
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.session_revocations';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- 3) Deduplicate: keep newest row per (user_id, device_stable_id)
WITH ranked AS (
  SELECT id, user_id, device_stable_id, created_at,
         ROW_NUMBER() OVER (PARTITION BY user_id, device_stable_id ORDER BY created_at DESC) rn
  FROM public.user_sessions
)
DELETE FROM public.user_sessions u
USING ranked r
WHERE u.id = r.id AND r.rn > 1;

-- 4) Enforce one row per device
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_sessions_unique_user_device'
  ) THEN
    ALTER TABLE public.user_sessions
    ADD CONSTRAINT user_sessions_unique_user_device
    UNIQUE (user_id, device_stable_id);
  END IF;
END $$;

-- 5) Ensure updated_at trigger exists
DROP TRIGGER IF EXISTS trg_user_sessions_set_updated_at ON public.user_sessions;
CREATE TRIGGER trg_user_sessions_set_updated_at
BEFORE INSERT OR UPDATE ON public.user_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_user_sessions_timestamp();

-- 6) Success notices
DO $$
BEGIN
  RAISE NOTICE '✅ Realtime enabled for user_sessions and session_revocations';
  RAISE NOTICE '✅ Deduplicated sessions - one card per device';
  RAISE NOTICE '✅ Unique constraint enforced on (user_id, device_stable_id)';
  RAISE NOTICE '✅ Remote logout signals will propagate instantly everywhere';
END $$;