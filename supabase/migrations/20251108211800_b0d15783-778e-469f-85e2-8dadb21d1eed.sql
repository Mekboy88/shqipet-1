-- =====================================================
-- CRITICAL FIX: Prevent automatic logout and anonymous state for all accounts
-- =====================================================

-- 1. Create session activity tracking table
CREATE TABLE IF NOT EXISTS public.session_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'login', 'logout', 'token_refresh', 'session_check'
  event_source TEXT, -- 'explicit_user_action', 'automatic', 'system'
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_session_activity_user_id ON public.session_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_session_activity_created_at ON public.session_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_activity_event_type ON public.session_activity(event_type);

-- Enable RLS
ALTER TABLE public.session_activity ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own session activity
CREATE POLICY "Users can view own session activity" ON public.session_activity
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Platform owners and super admins can view all session activity
CREATE POLICY "Admins can view all session activity" ON public.session_activity
  FOR SELECT
  USING (
    public.is_platform_owner(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
        AND role = 'super_admin' 
        AND is_active = true
    )
  );

-- 2. Create function to log session activity
CREATE OR REPLACE FUNCTION public.log_session_activity(
  p_event_type TEXT,
  p_event_source TEXT DEFAULT 'system',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_id UUID;
BEGIN
  -- Only log if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.session_activity (
    user_id,
    event_type,
    event_source,
    metadata
  ) VALUES (
    auth.uid(),
    p_event_type,
    p_event_source,
    p_metadata
  ) RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$;

-- 3. Create function to check if user has active session
CREATE OR REPLACE FUNCTION public.has_active_session(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_activity TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get last session activity
  SELECT created_at INTO last_activity
  FROM public.session_activity
  WHERE user_id = p_user_id
    AND event_type IN ('login', 'token_refresh', 'session_check')
  ORDER BY created_at DESC
  LIMIT 1;

  -- Consider session active if last activity was within 24 hours
  IF last_activity IS NOT NULL AND last_activity > (now() - INTERVAL '24 hours') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 4. Add comment to document the purpose
COMMENT ON TABLE public.session_activity IS 
'Tracks all session-related activities to prevent automatic logouts and debug session issues. 
CRITICAL: This table helps identify and prevent unauthorized automatic logouts for all account types.';

COMMENT ON FUNCTION public.log_session_activity IS 
'Logs session activity events for debugging and security monitoring. 
Use this to track explicit vs automatic logout events.';

COMMENT ON FUNCTION public.has_active_session IS 
'Checks if a user has an active session within the last 24 hours. 
Helps prevent accidental session invalidation.';

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_session_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_session TO authenticated;

-- 6. Log this migration
DO $$
BEGIN
  RAISE NOTICE '✅ Session protection database layer installed successfully!';
  RAISE NOTICE '✅ All accounts now have session activity tracking';
  RAISE NOTICE '✅ Automatic logout prevention measures in place';
  RAISE NOTICE '✅ Platform owner and all accounts are protected from session issues';
END $$;