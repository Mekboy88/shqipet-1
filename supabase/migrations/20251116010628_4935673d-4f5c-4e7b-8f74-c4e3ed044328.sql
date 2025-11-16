-- Phase 4: Add Database-Level Safeguards for Session System
-- Ensures active_tabs_count never goes below 1 (one card per device)

-- First, ensure UNIQUE constraint exists for (user_id, device_stable_id)
-- This prevents duplicate device cards at the database level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'user_sessions_user_id_device_stable_id_key'
      AND conrelid = 'public.user_sessions'::regclass
  ) THEN
    -- Create the UNIQUE constraint
    ALTER TABLE public.user_sessions 
    ADD CONSTRAINT user_sessions_user_id_device_stable_id_key 
    UNIQUE (user_id, device_stable_id);
    
    RAISE NOTICE '✅ Created UNIQUE constraint on (user_id, device_stable_id)';
  ELSE
    RAISE NOTICE '✅ UNIQUE constraint on (user_id, device_stable_id) already exists';
  END IF;
END $$;

-- Add CHECK constraint to enforce minimum tab count of 1
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'active_tabs_count_min_one'
      AND conrelid = 'public.user_sessions'::regclass
  ) THEN
    ALTER TABLE public.user_sessions 
    ADD CONSTRAINT active_tabs_count_min_one 
    CHECK (active_tabs_count >= 1);
    
    RAISE NOTICE '✅ Created CHECK constraint: active_tabs_count >= 1';
  ELSE
    RAISE NOTICE '✅ CHECK constraint active_tabs_count >= 1 already exists';
  END IF;
END $$;

-- Log migration success
DO $$
BEGIN
  RAISE NOTICE '🎉 Session system safeguards applied:';
  RAISE NOTICE '   - Tab count minimum: 1 (CHECK constraint)';
  RAISE NOTICE '   - Device uniqueness: (user_id, device_stable_id) UNIQUE constraint';
  RAISE NOTICE '   - Result: Only ONE card per physical device, always.';
END $$;