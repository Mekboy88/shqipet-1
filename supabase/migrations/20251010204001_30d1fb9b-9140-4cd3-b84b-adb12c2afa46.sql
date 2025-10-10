-- Add missing enum values to app_role type
-- These values are used throughout the codebase but were missing from the database

ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'platform_owner_root';