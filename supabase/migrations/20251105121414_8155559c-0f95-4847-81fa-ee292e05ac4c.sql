-- Add category column to live_streams table
ALTER TABLE public.live_streams 
ADD COLUMN category text DEFAULT 'general';

-- Add index for better filtering performance
CREATE INDEX idx_live_streams_category ON public.live_streams(category);
CREATE INDEX idx_live_streams_views ON public.live_streams(views);

-- Add some sample categories as a comment for reference
COMMENT ON COLUMN public.live_streams.category IS 'Categories: gaming, music, sports, education, entertainment, technology, lifestyle, general';