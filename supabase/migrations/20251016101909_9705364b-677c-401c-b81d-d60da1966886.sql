-- Set default for hire_button_enabled to false
ALTER TABLE public.professional_presentations 
ALTER COLUMN hire_button_enabled SET DEFAULT false;

-- Backfill existing NULL values to false
UPDATE public.professional_presentations 
SET hire_button_enabled = false 
WHERE hire_button_enabled IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.professional_presentations.hire_button_enabled IS 'Defaults to false; explicitly set to true to enable';

-- Optional: Add updated_at trigger to ensure consistency
CREATE OR REPLACE FUNCTION public.update_professional_presentations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_professional_presentations_timestamp
  BEFORE UPDATE ON public.professional_presentations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_professional_presentations_timestamp();