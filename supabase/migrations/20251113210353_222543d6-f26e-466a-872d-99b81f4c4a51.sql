-- Fix device types in existing sessions
-- This migration corrects misclassified device types based on user_agent patterns

-- Fix iPhones labeled as desktop/laptop
UPDATE user_sessions 
SET device_type = 'mobile'
WHERE device_type IN ('desktop', 'laptop', 'smartphone')
  AND (
    user_agent ILIKE '%iPhone%'
    OR user_agent ILIKE '%iPod%'
    OR user_agent ILIKE '%Android%Mobile%'
    OR user_agent ILIKE '%Windows Phone%'
  );

-- Fix iPads labeled as desktop
UPDATE user_sessions 
SET device_type = 'tablet'
WHERE device_type IN ('desktop', 'laptop')
  AND (
    user_agent ILIKE '%iPad%'
    OR (user_agent ILIKE '%Macintosh%' AND user_agent ILIKE '%Safari%' AND user_agent NOT ILIKE '%MacBook%')
  );

-- Fix Android tablets
UPDATE user_sessions 
SET device_type = 'tablet'
WHERE device_type IN ('desktop', 'laptop')
  AND user_agent ILIKE '%Android%'
  AND user_agent NOT ILIKE '%Mobile%'
  AND (
    user_agent ILIKE '%Tablet%'
    OR user_agent ILIKE '%Tab%'
  );

-- Fix MacBooks labeled as desktop
UPDATE user_sessions 
SET device_type = 'laptop'
WHERE device_type = 'desktop'
  AND (
    user_agent ILIKE '%MacBook%'
    OR user_agent ILIKE '%Notebook%'
  );

-- Normalize 'smartphone' to 'mobile'
UPDATE user_sessions 
SET device_type = 'mobile'
WHERE device_type = 'smartphone';

-- Log the changes
DO $$
DECLARE
  mobile_count INTEGER;
  tablet_count INTEGER;
  laptop_count INTEGER;
  desktop_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mobile_count FROM user_sessions WHERE device_type = 'mobile';
  SELECT COUNT(*) INTO tablet_count FROM user_sessions WHERE device_type = 'tablet';
  SELECT COUNT(*) INTO laptop_count FROM user_sessions WHERE device_type = 'laptop';
  SELECT COUNT(*) INTO desktop_count FROM user_sessions WHERE device_type = 'desktop';
  
  RAISE NOTICE 'Device type distribution after migration:';
  RAISE NOTICE 'Mobile: %', mobile_count;
  RAISE NOTICE 'Tablet: %', tablet_count;
  RAISE NOTICE 'Laptop: %', laptop_count;
  RAISE NOTICE 'Desktop: %', desktop_count;
END $$;