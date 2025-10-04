-- Create professional_presentations table to store user presentation data
CREATE TABLE IF NOT EXISTS public.professional_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Profile data
  name TEXT,
  role TEXT,
  entry TEXT,
  quick TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  cv_url TEXT,
  avatar_url TEXT,
  
  -- Navigation labels
  nav_labels JSONB DEFAULT '{"home": "Home", "skills": "Skills", "portfolio": "Portfolio", "blogs": "Blogs", "contact": "Contact"}'::jsonb,
  
  -- Style configurations
  styles JSONB DEFAULT '{}'::jsonb,
  
  -- Social links
  socials JSONB DEFAULT '[]'::jsonb,
  
  -- Section visibility
  sections JSONB DEFAULT '{"home": true, "skills": true, "portfolio": true, "blogs": true, "contact": true}'::jsonb,
  
  -- Layout settings
  layout JSONB DEFAULT '{"showRightSidebar": true, "leftColFraction": "1.1fr", "middleColFraction": "1.4fr", "rightColFraction": "0.5fr", "noiseOpacity": 0.06, "enableAnimations": true, "fullBleedPhoto": false, "photoHeight": 220}'::jsonb,
  
  -- SEO settings
  seo JSONB DEFAULT '{"pageTitle": "Professional Presentation", "description": "Clean, white-first personal page with skills, portfolio, and contact.", "openInNewWindow": true}'::jsonb,
  
  -- Accent color
  accent_color TEXT DEFAULT '#2AA1FF',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one presentation per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.professional_presentations ENABLE ROW LEVEL SECURITY;

-- Users can view their own presentation
CREATE POLICY "Users can view own presentation"
  ON public.professional_presentations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own presentation
CREATE POLICY "Users can insert own presentation"
  ON public.professional_presentations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own presentation
CREATE POLICY "Users can update own presentation"
  ON public.professional_presentations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own presentation
CREATE POLICY "Users can delete own presentation"
  ON public.professional_presentations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_professional_presentations_updated_at
  BEFORE UPDATE ON public.professional_presentations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_professional_presentations_user_id 
  ON public.professional_presentations(user_id);