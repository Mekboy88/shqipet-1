import React, { useRef, useState, useEffect } from "react";
import { liveVideos } from "./data/liveVideosData";
import LiveSectionHeader from "./components/LiveSectionHeader";
import LiveVideoList from "./components/LiveVideoList";
import LiveVideoGrid from "./components/LiveVideoGrid";
import LiveEmptyState from "./LiveEmptyState";
import { useLocalization } from '@/hooks/useLocalization';
import { supabase } from '@/integrations/supabase/client';
import "./styles/index.css";

const LiveNowSection: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [gridLayout, setGridLayout] = useState<"1x1" | "2x2" | "3x3" | "4x4">("1x1");
  const [liveStreams, setLiveStreams] = useState(liveVideos);
  const { t } = useLocalization();
  
  // Real-time subscription to avatar/cover updates
  useEffect(() => {
    const channel = supabase
      .channel('live-section-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          console.log('🔄 Live section: profile update detected, refreshing data');
          // Trigger re-render by updating state timestamp
          setLiveStreams([...liveVideos]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_photos'
        },
        () => {
          console.log('🔄 Live section: user photo update detected, refreshing data');
          setLiveStreams([...liveVideos]);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Show demo live streams for now (in a real app, this would check API)
  const hasLiveStreams = true; // liveVideos.length > 0;

  const scrollVideos = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      // Increased scroll amount for larger cards (approximately one card width)
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
      if (direction === 'right') {
        setShowLeftButton(true);
      }
      if (direction === 'left' && scrollContainerRef.current.scrollLeft + scrollAmount <= 0) {
        setShowLeftButton(false);
      }
    }
  };
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setShowLeftButton(scrollContainerRef.current.scrollLeft > 0);
    }
  };
  const getGridClass = () => {
    switch (gridLayout) {
      case "2x2":
        return "grid-layout-2x2";
      case "3x3":
        return "grid-layout-3x3";
      case "4x4":
        return "grid-layout-4x4";
      default:
        return "";
    }
  };
  return <div data-horizontal-scroll="true" className="p-0 m-0 leading-none" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} style={{
    overscrollBehaviorX: 'contain'
  }}>
      
      
      {hasLiveStreams ? <>
          <LiveSectionHeader gridLayout={gridLayout} setGridLayout={setGridLayout} />
          
          {gridLayout === "1x1" ? <LiveVideoList videos={liveStreams} showLeftButton={showLeftButton} isHovering={isHovering} onScroll={handleScroll} onScrollLeft={() => scrollVideos('left')} onScrollRight={() => scrollVideos('right')} ref={scrollContainerRef} /> : <LiveVideoGrid videos={liveStreams} gridLayout={gridLayout} getGridClass={getGridClass} />}
        </> : <LiveEmptyState />}
    </div>;
};
export default LiveNowSection;