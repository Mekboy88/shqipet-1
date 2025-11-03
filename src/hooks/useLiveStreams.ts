import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LiveVideo } from '@/components/live/types';
import { liveVideos as demoVideos } from '@/components/live/data/liveVideosData';

interface LiveStream {
  id: string;
  title: string;
  host: string;
  thumbnail_url: string;
  views: number;
  is_live: boolean;
  started_at: string;
  ended_at?: string;
}

export const useLiveStreams = () => {
  const [streams, setStreams] = useState<LiveVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🎥 useLiveStreams: Initializing');
    
    // Fetch initial live streams
    const fetchStreams = async () => {
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .select('*')
          .eq('is_live', true)
          .order('started_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        if (data && data.length > 0) {
          const mappedStreams: LiveVideo[] = data.map((stream: LiveStream) => ({
            id: stream.id,
            title: stream.title,
            host: stream.host,
            thumbnail: stream.thumbnail_url,
            views: stream.views,
            isLive: stream.is_live
          }));
          
          console.log('✅ useLiveStreams: Loaded streams from DB:', mappedStreams.length);
          setStreams(mappedStreams);
        } else {
          // Fallback to demo data if no streams
          console.log('ℹ️ useLiveStreams: No live streams, using demo data');
          setStreams(demoVideos);
        }
      } catch (err) {
        console.error('❌ useLiveStreams: Error fetching streams:', err);
        setError(err instanceof Error ? err.message : 'Failed to load streams');
        // Fallback to demo data on error
        setStreams(demoVideos);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();

    // Subscribe to realtime changes
    console.log('📡 useLiveStreams: Setting up realtime subscription');
    const channel = supabase
      .channel('live_streams_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_streams',
          filter: 'is_live=eq.true'
        },
        (payload) => {
          console.log('🔄 useLiveStreams: Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newStream = payload.new as LiveStream;
            setStreams(prev => [{
              id: newStream.id,
              title: newStream.title,
              host: newStream.host,
              thumbnail: newStream.thumbnail_url,
              views: newStream.views,
              isLive: newStream.is_live
            }, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedStream = payload.new as LiveStream;
            setStreams(prev => prev.map(stream => 
              stream.id === updatedStream.id
                ? {
                    id: updatedStream.id,
                    title: updatedStream.title,
                    host: updatedStream.host,
                    thumbnail: updatedStream.thumbnail_url,
                    views: updatedStream.views,
                    isLive: updatedStream.is_live
                  }
                : stream
            ).filter(s => s.isLive)); // Remove if no longer live
          } else if (payload.eventType === 'DELETE') {
            const deletedStream = payload.old as LiveStream;
            setStreams(prev => prev.filter(stream => stream.id !== deletedStream.id));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 useLiveStreams: Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  return { streams, loading, error };
};
