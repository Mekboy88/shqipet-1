-- Enable realtime for professional_presentations table
ALTER TABLE public.professional_presentations REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.professional_presentations;