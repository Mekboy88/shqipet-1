-- Create user_sessions table for device and session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_name TEXT,
  device_type TEXT,
  browser_info TEXT,
  operating_system TEXT,
  device_fingerprint TEXT NOT NULL,
  is_trusted BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  login_count INTEGER DEFAULT 1,
  location TEXT,
  ip_address TEXT,
  user_agent TEXT,
  session_token TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_fingerprint ON public.user_sessions(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = user_sessions.user_id
        AND profiles.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = user_sessions.user_id
        AND profiles.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = user_sessions.user_id
        AND profiles.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = user_sessions.user_id
        AND profiles.auth_user_id = auth.uid()
    )
  );

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions
  FOR SELECT
  USING (current_user_is_admin() OR is_platform_owner(auth.uid()));

-- Enable real-time replication
ALTER TABLE public.user_sessions REPLICA IDENTITY FULL;

-- Add to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_sessions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_sessions_timestamp();