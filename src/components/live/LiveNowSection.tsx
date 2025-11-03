import React, { useRef, useState } from "react";
import { useLiveStreams } from "@/hooks/useLiveStreams";
import LiveSectionHeader from "./components/LiveSectionHeader";
import LiveVideoList from "./components/LiveVideoList";
import LiveVideoGrid from "./components/LiveVideoGrid";
import LiveEmptyState from "./LiveEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalization } from '@/hooks/useLocalization';
import "./styles/index.css";

const LiveNowSection: React.FC = () => {
  console.log('🎬 LiveNowSection: Component mounted');
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [gridLayout, setGridLayout] = useState<"1x1" | "2x2" | "3x3" | "4x4">("1x1");
  const { t } = useLocalization();
  const { streams, loading, error } = useLiveStreams();

  const hasLiveStreams = streams.length > 0;

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
  // Show loading skeleton while fetching
  if (loading) {
    console.log('⏳ LiveNowSection: Loading streams');
    return (
      <div className="p-4">
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-64">
              <Skeleton className="w-full h-40 mb-2" variant="shimmer" />
              <Skeleton className="w-3/4 h-4 mb-1" variant="shimmer" />
              <Skeleton className="w-1/2 h-3" variant="shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('❌ LiveNowSection: Error loading streams:', error);
  }

  console.log('✅ LiveNowSection: Rendering with streams:', streams.length);

  return (
    <div 
      data-horizontal-scroll="true" 
      className="p-0 m-0 leading-none" 
      onMouseEnter={() => setIsHovering(true)} 
      onMouseLeave={() => setIsHovering(false)} 
      style={{ overscrollBehaviorX: 'contain' }}
    >
      {hasLiveStreams ? (
        <>
          <LiveSectionHeader gridLayout={gridLayout} setGridLayout={setGridLayout} />
          
          {gridLayout === "1x1" ? (
            <LiveVideoList 
              videos={streams} 
              showLeftButton={showLeftButton} 
              isHovering={isHovering} 
              onScroll={handleScroll} 
              onScrollLeft={() => scrollVideos('left')} 
              onScrollRight={() => scrollVideos('right')} 
              ref={scrollContainerRef} 
            />
          ) : (
            <LiveVideoGrid 
              videos={streams} 
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