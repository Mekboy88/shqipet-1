-- Step 1: Add device_stable_id column
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS device_stable_id text;

-- Step 2: Backfill with unique stable IDs (fingerprint + sequence for duplicates)
WITH ranked_sessions AS (
  SELECT 
    id,
    device_fingerprint,
    ROW_NUMBER() OVER (PARTITION BY user_id, device_fingerprint ORDER BY created_at) as rn
  FROM public.user_sessions
  WHERE device_stable_id IS NULL
)
UPDATE public.user_sessions us
SET device_stable_id = CASE 
  WHEN rs.rn = 1 THEN rs.device_fingerprint
  ELSE rs.device_fingerprint || '-' || rs.rn
END
FROM ranked_sessions rs
WHERE us.id = rs.id;

-- Step 3: Create unique index now that all values are unique
CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_unique_stable 
ON public.user_sessions (user_id, device_stable_id) 
WHERE device_stable_id IS NOT NULL;