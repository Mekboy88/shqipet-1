-- Ensure realtime delivers full row and table is in publication
DO $$
BEGIN
  -- Set REPLICA IDENTITY FULL to include all columns in WAL for updates
  BEGIN
    ALTER TABLE public.professional_presentations REPLICA IDENTITY FULL;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Replica identity already set or cannot change: %', SQLERRM;
  END;

  -- Add table to supabase_realtime publication (idempotent try)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.professional_presentations;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Table already in publication or publication missing: %', SQLERRM;
  END;
END $$;