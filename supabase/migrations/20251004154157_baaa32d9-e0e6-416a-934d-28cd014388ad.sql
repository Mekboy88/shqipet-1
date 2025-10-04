-- Add hire button fields to professional_presentations table
ALTER TABLE public.professional_presentations 
ADD COLUMN IF NOT EXISTS hire_button_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS hire_button_text text DEFAULT 'Hire Me',
ADD COLUMN IF NOT EXISTS hire_button_url text,
ADD COLUMN IF NOT EXISTS hire_button_email text;

-- Add comment for documentation
COMMENT ON COLUMN public.professional_presentations.hire_button_enabled IS 'Whether to show the hire button on the professional presentation';
COMMENT ON COLUMN public.professional_presentations.hire_button_text IS 'Text displayed on the hire button';
COMMENT ON COLUMN public.professional_presentations.hire_button_url IS 'URL to redirect when hire button is clicked';
COMMENT ON COLUMN public.professional_presentations.hire_button_email IS 'Email address for hire inquiries';