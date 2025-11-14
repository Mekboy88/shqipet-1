-- 5A: Add unique constraint for duplicate prevention (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_sessions_user_device_unique'
  ) THEN
    ALTER TABLE public.user_sessions 
    ADD CONSTRAINT user_sessions_user_device_unique 
    UNIQUE (user_id, device_stable_id);
  END IF;
END $$;

-- 5A: Add composite fingerprint hash column (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' 
    AND column_name = 'composite_fingerprint_hash'
  ) THEN
    ALTER TABLE public.user_sessions 
    ADD COLUMN composite_fingerprint_hash TEXT;
  END IF;
END $$;

-- 5C: Create function to auto-revoke expired sessions
CREATE OR REPLACE FUNCTION revoke_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_sessions
  SET 
    is_active = false,
    session_status = 'expired'
  WHERE 
    session_expires_at < NOW()
    AND is_active = true;
END;
$$;

-- 5C: Create function to log security events
CREATE OR REPLACE FUNCTION log_device_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_description TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    event_description,
    risk_level,
    metadata
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_description,
    CASE 
      WHEN p_event_type IN ('new_device', 'location_change') THEN 'medium'
      WHEN p_event_type = 'session_expired' THEN 'low'
      ELSE 'info'
    END,
    p_metadata
  )
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- Create index for faster expired session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_expiration 
ON public.user_sessions(session_expires_at) 
WHERE is_active = true;