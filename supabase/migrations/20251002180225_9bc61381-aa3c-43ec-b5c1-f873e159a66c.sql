-- Create user_photos table to persist avatar and cover uploads
CREATE TABLE IF NOT EXISTS public.user_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  photo_key TEXT NOT NULL,
  photo_url TEXT,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('profile','cover','gallery')),
  original_filename TEXT,
  file_size INTEGER,
  content_type TEXT,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_photos ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage their own photos
CREATE POLICY "Users can select own photos"
ON public.user_photos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos"
ON public.user_photos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos"
ON public.user_photos
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos"
ON public.user_photos
FOR DELETE
USING (auth.uid() = user_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_photos_user ON public.user_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_photos_type ON public.user_photos(photo_type);
CREATE INDEX IF NOT EXISTS idx_user_photos_current ON public.user_photos(user_id, photo_type, is_current);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_user_photos_updated_at ON public.user_photos;
CREATE TRIGGER trg_user_photos_updated_at
BEFORE UPDATE ON public.user_photos
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();