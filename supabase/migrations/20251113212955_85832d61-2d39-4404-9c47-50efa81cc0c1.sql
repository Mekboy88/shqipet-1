-- Backfill and enforce stable device ID for user_sessions
DO $$ BEGIN
  -- 1) Backfill missing stable IDs from fingerprint when available
  UPDATE public.user_sessions
  SET device_stable_id = device_fingerprint
  WHERE (device_stable_id IS NULL OR device_stable_id = '')
    AND device_fingerprint IS NOT NULL;

  -- 2) Delete orphaned rows without any usable identifier
  DELETE FROM public.user_sessions
  WHERE (device_stable_id IS NULL OR device_stable_id = '')
    AND (device_fingerprint IS NULL OR device_fingerprint = '');

  -- 3) Add NOT NULL constraint on device_stable_id
  ALTER TABLE public.user_sessions
  ALTER COLUMN device_stable_id SET NOT NULL;

  -- 4) Ensure uniqueness per user for stable ID
  CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_user_stable
  ON public.user_sessions(user_id, device_stable_id);
END $$;