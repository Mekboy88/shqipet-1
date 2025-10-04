-- Allow public viewing of professional presentations
-- This enables anyone to view the presentation content while keeping edit controls private

CREATE POLICY "Anyone can view professional presentations"
ON public.professional_presentations
FOR SELECT
USING (true);

-- The existing policy "Users can view own presentation" will still exist
-- but we need this new policy for public access

COMMENT ON POLICY "Anyone can view professional presentations" 
ON public.professional_presentations 
IS 'Allows public viewing of presentation content. Edit controls are still restricted to owner via application logic.';