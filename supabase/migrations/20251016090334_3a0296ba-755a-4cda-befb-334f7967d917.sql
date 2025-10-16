-- Fix professional_presentations privacy: owner-only access (retry without realtime)
-- Drop public SELECT policy  
DROP POLICY IF EXISTS "Anyone can view professional presentations" ON public.professional_presentations;

-- Ensure strict owner-only policies exist
DROP POLICY IF EXISTS "Users view own presentation" ON public.professional_presentations;
CREATE POLICY "Users view own presentation" 
ON public.professional_presentations 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own presentation" ON public.professional_presentations;
CREATE POLICY "Users insert own presentation" 
ON public.professional_presentations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own presentation" ON public.professional_presentations;
CREATE POLICY "Users update own presentation" 
ON public.professional_presentations 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own presentation" ON public.professional_presentations;
CREATE POLICY "Users delete own presentation" 
ON public.professional_presentations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable REPLICA IDENTITY for realtime (table already in publication)
ALTER TABLE public.professional_presentations REPLICA IDENTITY FULL;