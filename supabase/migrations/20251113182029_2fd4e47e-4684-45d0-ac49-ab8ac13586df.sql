-- Standardize device_type values to the 4 canonical types
UPDATE public.user_sessions
SET device_type = 'mobile'
WHERE device_type IN ('smartphone', 'phone');

-- Remove duplicates per (user_id, device_stable_id) keeping the most recent
WITH ranked AS (
  SELECT id, user_id, device_stable_id,
         COALESCE(last_activity, updated_at, created_at) AS ts,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, device_stable_id
           ORDER BY COALESCE(last_activity, updated_at, created_at) DESC, id DESC
         ) AS rn
  FROM public.user_sessions
  WHERE device_stable_id IS NOT NULL
)
DELETE FROM public.user_sessions u
USING ranked r
WHERE u.id = r.id AND r.rn > 1;

-- Remove duplicates where stable id is NULL by (user_id, device_fingerprint), keep most recent
WITH ranked_null AS (
  SELECT id, user_id, device_fingerprint,
         COALESCE(last_activity, updated_at, created_at) AS ts,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, device_fingerprint
           ORDER BY COALESCE(last_activity, updated_at, created_at) DESC, id DESC
         ) AS rn
  FROM public.user_sessions
  WHERE device_stable_id IS NULL
)
DELETE FROM public.user_sessions u
USING ranked_null r
WHERE u.id = r.id AND r.rn > 1;

-- Ensure unique index on (user_id, device_stable_id) exists (partial for non-null)
CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_unique_stable
ON public.user_sessions (user_id, device_stable_id)
WHERE device_stable_id IS NOT NULL;