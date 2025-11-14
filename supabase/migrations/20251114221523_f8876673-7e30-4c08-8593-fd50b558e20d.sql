-- =====================================================
-- ENABLE REALTIME FOR USER SESSIONS
-- =====================================================
-- Purpose: Enable instant updates when devices login/logout
-- Ensures UI updates in real-time across all connected clients
-- =====================================================

-- 1) Ensure full row data is available for realtime diffs
ALTER TABLE public.user_sessions REPLICA IDENTITY FULL;

-- 2) Add user_sessions to realtime publication (idempotent)
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions';
  EXCEPTION WHEN duplicate_object THEN
    -- Already added
    NULL;
  END;
END $$;

-- 3) Helpful notice
DO $$
BEGIN
  RAISE NOTICE '✅ Realtime enabled for user_sessions';
  RAISE NOTICE '✅ New device logins will now appear instantly';
  RAISE NOTICE '✅ Session updates will reflect without page reload';
END $$;