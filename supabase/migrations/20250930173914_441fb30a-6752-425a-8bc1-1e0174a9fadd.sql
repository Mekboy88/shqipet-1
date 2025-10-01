-- Add cover_url column to profiles table for user cover/banner images
ALTER TABLE public.profiles
ADD COLUMN cover_url text;