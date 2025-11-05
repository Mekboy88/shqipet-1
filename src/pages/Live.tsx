
import React from 'react';
import { Helmet } from 'react-helmet-async';
import LiveNowSection from '@/components/live/LiveNowSection';

const Live: React.FC = () => {
  console.log('📺 Live page: Component mounted');
  
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Live Streams | Watch Live Now</title>
        <meta name="description" content="Watch live streams now. Explore live videos and trending broadcasts." />
        <link rel="canonical" href="/live" />
      </Helmet>
      <main>
        <h1 className="sr-only">Live Streams</h1>
        <LiveNowSection />
      </main>
    </div>
  );
};

export default Live;
