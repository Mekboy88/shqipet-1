-- =====================================================
-- FIX: Manage Sessions RLS Policies
-- =====================================================
-- Purpose: Remove fragile profiles table dependency from user_sessions RLS
-- Issue: Policies checking profiles table fail when profile doesn't exist,
--        blocking legitimate session records from appearing
-- Solution: Direct user_id = auth.uid() checks only, no profile lookups
-- =====================================================

-- Safety: ensure table exists and RLS is enabled
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Drop old policies (all duplicates and profile-dependent ones)
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS admin_all_sessions ON public.user_sessions;
DROP POLICY IF EXISTS view_own_sessions ON public.user_sessions;
DROP POLICY IF EXISTS insert_own_sessions ON public.user_sessions;
DROP POLICY IF EXISTS update_own_sessions ON public.user_sessions;
DROP POLICY IF EXISTS delete_own_sessions ON public.user_sessions;

-- Re-create clean, profile-independent policies
-- 1) Users can view their own sessions; admins/platform owners can view all
CREATE POLICY view_own_sessions ON public.user_sessions
FOR SELECT
USING (
  user_id = auth.uid() 
  OR public.current_user_is_admin() 
  OR public.is_platform_owner(auth.uid())
);

-- 2) Users can insert their own sessions
CREATE POLICY insert_own_sessions ON public.user_sessions
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 3) Users can update their own sessions; admins/platform owners too
CREATE POLICY update_own_sessions ON public.user_sessions
FOR UPDATE
USING (
  user_id = auth.uid() 
  OR public.current_user_is_admin() 
  OR public.is_platform_owner(auth.uid())
)
WITH CHECK (
  user_id = auth.uid() 
  OR public.current_user_is_admin() 
  OR public.is_platform_owner(auth.uid())
);

-- 4) Users can delete their own sessions; admins/platform owners too
CREATE POLICY delete_own_sessions ON public.user_sessions
FOR DELETE
USING (
  user_id = auth.uid() 
  OR public.current_user_is_admin() 
  OR public.is_platform_owner(auth.uid())
);

-- Enable realtime for instant session updates
ALTER TABLE public.user_sessions REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions';
  EXCEPTION WHEN duplicate_object THEN
    -- Already added, skip
    NULL;
  END;
END $$;

-- Success notices
DO $$
BEGIN
  RAISE NOTICE '✅ user_sessions RLS policies fixed - now profile-independent';
  RAISE NOTICE '✅ Realtime enabled for instant session updates';
  RAISE NOTICE '✅ Manage Sessions page should now display devices correctly';
END $$;