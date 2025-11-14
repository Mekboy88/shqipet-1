-- Fix duplicates and enforce one row per device per user
-- 1) Remove duplicates keeping the most recent row
WITH ranked AS (
  SELECT ctid, user_id, device_stable_id,
         COALESCE(last_activity, updated_at, created_at) AS activity_ts,
         row_number() OVER (
           PARTITION BY user_id, device_stable_id
           ORDER BY COALESCE(last_activity, updated_at, created_at) DESC
         ) AS rn
  FROM public.user_sessions
)
DELETE FROM public.user_sessions u
USING ranked r
WHERE u.ctid = r.ctid
  AND r.rn > 1;

-- 2) Enforce uniqueness at the database level for upserts to work atomically
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_user_device_unique
ON public.user_sessions (user_id, device_stable_id);

-- 3) Improve realtime payloads (full-row updates)
ALTER TABLE public.user_sessions REPLICA IDENTITY FULL;