-- Drop the entire table with CASCADE to remove all dependencies
DROP TABLE IF EXISTS public.user_sessions CASCADE;

-- Recreate user_sessions from scratch with privacy-compliant, minimal fields
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_id text NOT NULL,
  device_stable_id text NOT NULL,
  device_type text NOT NULL CHECK (device_type IN ('mobile','tablet','laptop','desktop')),
  operating_system text,
  browser_name text,
  browser_version text,
  screen_resolution text,
  platform text,
  user_agent text,
  is_current_device boolean NOT NULL DEFAULT false,
  is_trusted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  session_id text NOT NULL DEFAULT gen_random_uuid()::text,
  logout_reason text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  city text,
  country text,
  country_code text,
  region text,
  CONSTRAINT fk_user_sessions_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own device sessions"
ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device sessions"
ON public.user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device sessions"
ON public.user_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device sessions"
ON public.user_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE UNIQUE INDEX user_sessions_user_device_unique ON public.user_sessions (user_id, device_stable_id);
CREATE INDEX user_sessions_session_id_idx ON public.user_sessions (session_id);

CREATE TRIGGER trg_user_sessions_updated_at
BEFORE UPDATE ON public.user_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_sessions REPLICA IDENTITY FULL;