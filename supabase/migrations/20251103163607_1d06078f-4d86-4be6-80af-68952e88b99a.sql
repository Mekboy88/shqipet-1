-- Create live_streams table for real-time live stream management
CREATE TABLE IF NOT EXISTS public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  host TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  is_live BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- Policy: Allow everyone (anon + authenticated) to view live streams
CREATE POLICY "Anyone can view live streams"
  ON public.live_streams
  FOR SELECT
  USING (is_live = true);

-- Policy: Allow admins to manage live streams
CREATE POLICY "Admins can manage live streams"
  ON public.live_streams
  FOR ALL
  USING (
    current_user_is_admin() OR is_platform_owner(auth.uid())
  );

-- Add updated_at trigger
CREATE TRIGGER set_live_streams_updated_at
  BEFORE UPDATE ON public.live_streams
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;

-- Insert demo data for testing
INSERT INTO public.live_streams (title, host, thumbnail_url, views, is_live) VALUES
  ('Morning Music Stream', '@MusicChannel', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80', 2300, true),
  ('Cooking Class Live', '@ChefMaria', 'https://images.unsplash.com/photo-1542010589005-d1eacc3918f2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1292&q=80', 1250, true),
  ('Gaming Finals', '@ProGamers', 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1057&q=80', 5600, true),
  ('Travel Guide: Paris', '@AdventureTime', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80', 987, true);