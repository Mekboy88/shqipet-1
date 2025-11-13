-- Clean up and standardize existing user_sessions data
-- This migration fixes device type labels and merges duplicate sessions

-- Step 1: Standardize device_type values to canonical set
UPDATE user_sessions
SET device_type = CASE
  WHEN device_type IN ('smartphone', 'phone', 'mobile') THEN 'mobile'
  WHEN device_type = 'tablet' THEN 'tablet'
  WHEN device_type = 'laptop' THEN 'laptop'
  WHEN device_type IN ('desktop', 'pc') THEN 'desktop'
  ELSE 'desktop' -- Default unknown to desktop
END
WHERE device_type NOT IN ('mobile', 'tablet', 'laptop', 'desktop');

-- Step 2: Backfill operating_system from user_agent for common patterns
-- This ensures iOS/Android devices are properly labeled
UPDATE user_sessions
SET operating_system = CASE
  WHEN user_agent ILIKE '%iPhone%' OR user_agent ILIKE '%iPad%' THEN 'iOS'
  WHEN user_agent ILIKE '%Android%' THEN 'Android'
  WHEN user_agent ILIKE '%Macintosh%' OR user_agent ILIKE '%Mac OS X%' THEN 'macOS'
  WHEN user_agent ILIKE '%Windows NT%' THEN 'Windows'
  WHEN user_agent ILIKE '%Linux%' AND user_agent NOT ILIKE '%Android%' THEN 'Linux'
  ELSE operating_system
END
WHERE operating_system IS NULL OR operating_system = '' OR operating_system ILIKE '%unknown%';

-- Step 3: Fix device_type based on user_agent patterns (mobile/tablet detection)
UPDATE user_sessions
SET device_type = CASE
  WHEN user_agent ILIKE '%iPhone%' OR user_agent ILIKE '%iPod%' THEN 'mobile'
  WHEN user_agent ILIKE '%iPad%' THEN 'tablet'
  WHEN user_agent ILIKE '%Android%' AND user_agent ILIKE '%Mobile%' THEN 'mobile'
  WHEN user_agent ILIKE '%Android%' AND user_agent NOT ILIKE '%Mobile%' THEN 'tablet'
  ELSE device_type
END
WHERE (user_agent ILIKE '%iPhone%' OR user_agent ILIKE '%iPad%' OR user_agent ILIKE '%Android%')
  AND device_type IN ('desktop', 'laptop');

-- Step 4: Merge duplicate sessions per device
-- Keep the most recent session for each (user_id, device_stable_id) combination
WITH ranked_sessions AS (
  SELECT 
    id,
    user_id,
    COALESCE(device_stable_id, device_fingerprint) as stable_key,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, COALESCE(device_stable_id, device_fingerprint)
      ORDER BY COALESCE(last_activity, updated_at) DESC
    ) as rn
  FROM user_sessions
  WHERE device_stable_id IS NOT NULL OR device_fingerprint IS NOT NULL
),
sessions_to_delete AS (
  SELECT id 
  FROM ranked_sessions 
  WHERE rn > 1
)
DELETE FROM user_sessions
WHERE id IN (SELECT id FROM sessions_to_delete);

-- Step 5: Update device_stable_id for remaining sessions without one
-- Use device_fingerprint as stable_id when device_stable_id is missing
UPDATE user_sessions
SET device_stable_id = COALESCE(device_stable_id, device_fingerprint)
WHERE device_stable_id IS NULL AND device_fingerprint IS NOT NULL;