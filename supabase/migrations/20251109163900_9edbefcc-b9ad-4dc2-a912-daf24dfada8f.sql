-- Add professional_button_color column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS professional_button_color TEXT DEFAULT 'rgba(255, 255, 255, 0.1)';