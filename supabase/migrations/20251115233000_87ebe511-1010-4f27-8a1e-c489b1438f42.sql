-- =====================================================
-- REALTIME VISIBILITY FOR SESSIONS & REVOCATIONS
-- =====================================================
-- Purpose: Ensure instant remote logout by publishing changes from
--          user_sessions and session_revocations with full row diff
-- Safety: Idempotent publication changes; no data exposure changes
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

-- 3) Helpful notices
DO $$
BEGIN
  RAISE NOTICE '✅ Realtime enabled for user_sessions and session_revocations';
  RAISE NOTICE '✅ Remote logout signals will now propagate instantly';
END $$;