-- Create personal_introduction table
CREATE TABLE public.personal_introduction (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school text,
  city text,
  profession text,
  languages text[],
  hobbies text,
  favorite_quote text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.personal_introduction ENABLE ROW LEVEL SECURITY;

-- Users can view their own personal introduction
CREATE POLICY "Users can view own introduction"
ON public.personal_introduction
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own personal introduction
CREATE POLICY "Users can insert own introduction"
ON public.personal_introduction
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own personal introduction
CREATE POLICY "Users can update own introduction"
ON public.personal_introduction
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own personal introduction
CREATE POLICY "Users can delete own introduction"
ON public.personal_introduction
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_personal_introduction_updated_at
BEFORE UPDATE ON public.personal_introduction
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();