-- 1. Add unique partial index to enforce one record per physical device
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_user_stable_device 
ON public.user_sessions(user_id, device_stable_id)
WHERE device_stable_id IS NOT NULL;

-- 2. Standardize device_type values to canonical 4 types
UPDATE public.user_sessions
SET device_type = CASE
  WHEN device_type IN ('smartphone', 'mobile phone') THEN 'mobile'
  WHEN device_type = 'desktop' THEN 'desktop'
  WHEN device_type = 'laptop' THEN 'laptop'
  WHEN device_type = 'tablet' THEN 'tablet'
  ELSE 'desktop' -- Default unknown to desktop
END
WHERE device_type NOT IN ('mobile', 'desktop', 'laptop', 'tablet');

-- 3. Remove duplicate sessions per (user_id, device_stable_id), keep most recent
WITH ranked_sessions AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, device_stable_id 
           ORDER BY COALESCE(last_activity, updated_at, created_at) DESC
         ) as rn
  FROM public.user_sessions
  WHERE device_stable_id IS NOT NULL
)
DELETE FROM public.user_sessions
WHERE id IN (
  SELECT id FROM ranked_sessions WHERE rn > 1
);

-- 4. Backfill missing operating_system from user_agent for iOS/Android
UPDATE public.user_sessions
SET operating_system = CASE
  WHEN user_agent ILIKE '%iphone%' OR user_agent ILIKE '%ipad%' THEN 'iOS'
  WHEN user_agent ILIKE '%android%' THEN 'Android'
  WHEN user_agent ILIKE '%windows%' THEN 'Windows'
  WHEN user_agent ILIKE '%mac os%' OR user_agent ILIKE '%macintosh%' THEN 'macOS'
  WHEN user_agent ILIKE '%linux%' THEN 'Linux'
  ELSE operating_system
END
WHERE operating_system IS NULL OR operating_system = '' OR operating_system = 'Unknown OS';

-- 5. Backfill device_type from user_agent patterns
UPDATE public.user_sessions
SET device_type = CASE
  WHEN user_agent ILIKE '%iphone%' OR user_agent ILIKE '%android mobile%' THEN 'mobile'
  WHEN user_agent ILIKE '%ipad%' OR user_agent ILIKE '%tablet%' THEN 'tablet'
  WHEN user_agent ILIKE '%macbook%' OR user_agent ILIKE '%laptop%' THEN 'laptop'
  ELSE 'desktop'
END
WHERE device_type IS NULL OR device_type = '' OR device_type = 'unknown';