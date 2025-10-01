import React, { useRef, useState } from "react";
import { liveVideos } from "./data/liveVideosData";
import LiveSectionHeader from "./components/LiveSectionHeader";
import LiveVideoList from "./components/LiveVideoList";
import LiveVideoGrid from "./components/LiveVideoGrid";
import LiveEmptyState from "./LiveEmptyState";
import { useLocalization } from '@/hooks/useLocalization';
import "./styles/index.css";

const LiveNowSection: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [gridLayout, setGridLayout] = useState<"1x1" | "2x2" | "3x3" | "4x4">("1x1");
  const { t } = useLocalization();
  
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
      case "2x2": return "grid-layout-2x2";
      case "3x3": return "grid-layout-3x3";
      case "4x4": return "grid-layout-4x4";
      default: return "";
    }
  };

  return (
    <div 
      data-horizontal-scroll="true"
      className="p-0 m-0 leading-none" 
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        overscrollBehaviorX: 'contain',
      }}
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 px-4">
          {t('feed.live_section_title', 'Live Now')}
        </h2>
      </div>
      
      {hasLiveStreams ? (
        <>
          <LiveSectionHeader 
            gridLayout={gridLayout} 
            setGridLayout={setGridLayout} 
          />
          
          {gridLayout === "1x1" ? (
            <LiveVideoList 
              videos={liveVideos}
              showLeftButton={showLeftButton}
              isHovering={isHovering}
              onScroll={handleScroll}
              onScrollLeft={() => scrollVideos('left')}
              onScrollRight={() => scrollVideos('right')}
              ref={scrollContainerRef}
            />
          ) : (
            <LiveVideoGrid 
              videos={liveVideos}
              gridLayout={gridLayout}
              getGridClass={getGridClass}
            />
          )}
        </>
      ) : (
        <LiveEmptyState />
      )}
    </div>
  );
};

export default LiveNowSection;
