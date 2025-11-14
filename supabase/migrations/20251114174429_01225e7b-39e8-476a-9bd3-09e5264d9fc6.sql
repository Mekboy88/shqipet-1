-- ============================================
-- REGULATORY-COMPLIANT SESSION MANAGEMENT
-- ============================================

-- Add regulatory compliance and enhanced tracking fields
ALTER TABLE public.user_sessions
ADD COLUMN IF NOT EXISTS consent_tracking jsonb DEFAULT '{
  "session_tracking": false,
  "location_tracking": false,
  "device_fingerprinting": false,
  "granted_at": null
}'::jsonb,
ADD COLUMN IF NOT EXISTS session_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ip_hash text,
ADD COLUMN IF NOT EXISTS last_verified_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS trust_score integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS data_retention_days integer DEFAULT 90,
ADD COLUMN IF NOT EXISTS anomaly_flags jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS device_os_version text,
ADD COLUMN IF NOT EXISTS device_brand text,
ADD COLUMN IF NOT EXISTS device_full_name text,
ADD COLUMN IF NOT EXISTS browser_version text,
ADD COLUMN IF NOT EXISTS is_vpn boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS connection_type text;

-- Add comments for documentation
COMMENT ON COLUMN public.user_sessions.consent_tracking IS 'GDPR compliance: tracks user consent for various tracking activities';
COMMENT ON COLUMN public.user_sessions.session_expires_at IS 'Automatic session expiry for security';
COMMENT ON COLUMN public.user_sessions.ip_hash IS 'Hashed IP address for privacy compliance';
COMMENT ON COLUMN public.user_sessions.trust_score IS 'Security scoring (0-100): 0=suspicious, 100=fully trusted';
COMMENT ON COLUMN public.user_sessions.data_retention_days IS 'Days to retain this session data before auto-deletion';
COMMENT ON COLUMN public.user_sessions.anomaly_flags IS 'Array of detected anomalies (impossible_travel, suspicious_device, etc.)';

-- Create function to hash IP addresses (privacy-preserving)
CREATE OR REPLACE FUNCTION hash_ip_address(ip_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF ip_text IS NULL THEN
    RETURN NULL;
  END IF;
  -- Simple hash for privacy (in production, use better hashing)
  RETURN encode(digest(ip_text || 'session_salt_2024', 'sha256'), 'hex');
END;
$$;

-- Create function to auto-delete expired sessions (data retention)
CREATE OR REPLACE FUNCTION delete_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete sessions that have passed their retention period
  WITH deleted AS (
    DELETE FROM public.user_sessions
    WHERE 
      created_at < now() - (data_retention_days || ' days')::interval
      AND session_status != 'active'
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

-- Create function to calculate trust score based on session behavior
CREATE OR REPLACE FUNCTION calculate_trust_score(
  p_session_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score integer := 50; -- Start at neutral
  v_session record;
  v_anomaly_count integer;
BEGIN
  SELECT * INTO v_session FROM public.user_sessions WHERE id = p_session_id;
  
  IF NOT FOUND THEN
    RETURN 50;
  END IF;
  
  -- Increase trust for:
  -- 1. Verified/trusted devices (+30)
  IF v_session.is_trusted THEN
    v_score := v_score + 30;
  END IF;
  
  -- 2. Long-term usage (+20)
  IF v_session.login_count > 10 THEN
    v_score := v_score + 20;
  END IF;
  
  -- 3. MFA enabled (+20)
  IF v_session.mfa_enabled THEN
    v_score := v_score + 20;
  END IF;
  
  -- 4. Consistent location (+10)
  IF v_session.country IS NOT NULL AND v_session.city IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;
  
  -- Decrease trust for:
  -- 1. Anomalies detected (-10 each)
  v_anomaly_count := jsonb_array_length(COALESCE(v_session.anomaly_flags, '[]'::jsonb));
  v_score := v_score - (v_anomaly_count * 10);
  
  -- 2. VPN usage (-5)
  IF v_session.is_vpn THEN
    v_score := v_score - 5;
  END IF;
  
  -- 3. No location data (-5)
  IF v_session.country IS NULL THEN
    v_score := v_score - 5;
  END IF;
  
  -- Clamp between 0 and 100
  v_score := GREATEST(0, LEAST(100, v_score));
  
  RETURN v_score;
END;
$$;

-- Create trigger to auto-update trust scores
CREATE OR REPLACE FUNCTION update_session_trust_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.trust_score := calculate_trust_score(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_session_trust_score ON public.user_sessions;
CREATE TRIGGER trigger_update_session_trust_score
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_trust_score();

-- Create index for faster queries on active sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_active_expires 
  ON public.user_sessions(user_id, session_status, session_expires_at)
  WHERE session_status = 'active';

-- Create index for trust score queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_trust_score 
  ON public.user_sessions(user_id, trust_score DESC)
  WHERE session_status = 'active';

-- Create index for device lookup
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_type 
  ON public.user_sessions(user_id, device_type, platform_type)
  WHERE session_status = 'active';