-- Add mobile redirect preference and tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS prefers_desktop boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_device text,
  ADD COLUMN IF NOT EXISTS last_redirect_host text,
  ADD COLUMN IF NOT EXISTS last_redirect_at timestamp with time zone;