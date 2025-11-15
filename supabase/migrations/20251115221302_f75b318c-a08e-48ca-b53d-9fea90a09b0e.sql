-- Create dedicated revocation signal table and enable realtime + RLS
-- 1) Table
CREATE TABLE IF NOT EXISTS public.session_revocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_stable_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Enable RLS
ALTER TABLE public.session_revocations ENABLE ROW LEVEL SECURITY;

-- 3) RLS policies: owner-only insert/select
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'session_revocations' AND policyname = 'Users can insert own revocation signals'
  ) THEN
    CREATE POLICY "Users can insert own revocation signals"
      ON public.session_revocations
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'session_revocations' AND policyname = 'Users can view own revocation signals'
  ) THEN
    CREATE POLICY "Users can view own revocation signals"
      ON public.session_revocations
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- 4) Add to realtime publication if not already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'session_revocations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.session_revocations;
  END IF;
END$$;

-- 5) Ensure DELETE events on user_sessions include old data
ALTER TABLE public.user_sessions REPLICA IDENTITY FULL;