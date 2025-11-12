-- Add missing fields to user_sessions table for enhanced device tracking

-- Add new columns for complete device and session information
ALTER TABLE public.user_sessions
ADD COLUMN IF NOT EXISTS screen_resolution text,
ADD COLUMN IF NOT EXISTS network_provider text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS country_code text,
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS platform_type text DEFAULT 'web' CHECK (platform_type IN ('web', 'ios', 'android', 'pwa')),
ADD COLUMN IF NOT EXISTS app_version text,
ADD COLUMN IF NOT EXISTS hardware_info jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mfa_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS security_alerts jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS session_status text DEFAULT 'active' CHECK (session_status IN ('active', 'logged_in', 'inactive'));

-- Add index for faster location queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_location ON public.user_sessions(city, country);
CREATE INDEX IF NOT EXISTS idx_user_sessions_coordinates ON public.user_sessions(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON public.user_sessions(session_status);

-- Add comment for documentation
COMMENT ON COLUMN public.user_sessions.screen_resolution IS 'Device screen resolution (e.g., 1920x1080)';
COMMENT ON COLUMN public.user_sessions.network_provider IS 'ISP/Network provider name';
COMMENT ON COLUMN public.user_sessions.city IS 'City detected from IP geolocation';
COMMENT ON COLUMN public.user_sessions.country IS 'Country detected from IP geolocation';
COMMENT ON COLUMN public.user_sessions.country_code IS 'ISO country code (e.g., US, GB, AL)';
COMMENT ON COLUMN public.user_sessions.latitude IS 'Latitude coordinate';
COMMENT ON COLUMN public.user_sessions.longitude IS 'Longitude coordinate';
COMMENT ON COLUMN public.user_sessions.platform_type IS 'Platform type: web, ios, android, or pwa';
COMMENT ON COLUMN public.user_sessions.app_version IS 'Mobile app version if applicable';
COMMENT ON COLUMN public.user_sessions.hardware_info IS 'JSON containing CPU, device model, etc.';
COMMENT ON COLUMN public.user_sessions.mfa_enabled IS 'Whether MFA is enabled for this session';
COMMENT ON COLUMN public.user_sessions.security_alerts IS 'JSON array of security alerts/warnings';
COMMENT ON COLUMN public.user_sessions.session_status IS 'Current session status: active, logged_in, or inactive';