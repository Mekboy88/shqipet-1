-- 1. Add explicit RLS policies for user_sessions table
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.user_sessions;

CREATE POLICY "Users can select own sessions"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
ON public.user_sessions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions"
ON public.user_sessions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 2. Add unique index on (user_id, device_stable_id) to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_user_device 
ON public.user_sessions(user_id, device_stable_id);

-- 3. Add index for fast session listing
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_activity 
ON public.user_sessions(user_id, last_activity DESC);

-- 4. Add updated_at trigger to auto-update timestamps
DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON public.user_sessions;

CREATE TRIGGER update_user_sessions_updated_at
BEFORE UPDATE ON public.user_sessions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();