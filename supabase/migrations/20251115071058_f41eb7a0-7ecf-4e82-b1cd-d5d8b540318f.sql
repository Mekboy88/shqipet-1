-- Add 'developer' and 'support' to app_role enum
-- This fixes the enum mismatch causing build errors

ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'support';