import React, { useRef, useState, useMemo } from "react";
import { useLiveStreams } from "@/hooks/useLiveStreams";
import LiveSectionHeader from "./components/LiveSectionHeader";
import LiveVideoList from "./components/LiveVideoList";
import LiveVideoGrid from "./components/LiveVideoGrid";
import LiveEmptyState from "./LiveEmptyState";
import LiveFilters, { LiveFiltersState } from "./components/LiveFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalization } from '@/hooks/useLocalization';
import "./styles/index.css";

const LiveNowSection: React.FC = () => {
  console.log('🎬 LiveNowSection: Component mounted');
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [gridLayout, setGridLayout] = useState<"1x1" | "2x2" | "3x3" | "4x4">("1x1");
  const [filters, setFilters] = useState<LiveFiltersState>({
    searchQuery: '',
    category: 'all',
    minViews: 0,
  });
  const { t } = useLocalization();
  const { streams, loading, error } = useLiveStreams();

  // Filter streams based on user input
  const filteredStreams = useMemo(() => {
    return streams.filter(stream => {
      // Search filter (host or title)
      const searchLower = filters.searchQuery.toLowerCase();
      const matchesSearch = !filters.searchQuery || 
        stream.host.toLowerCase().includes(searchLower) ||
        stream.title.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = filters.category === 'all' || 
        stream.category === filters.category;

      // Viewer count filter
      const matchesViews = stream.views >= filters.minViews;

      return matchesSearch && matchesCategory && matchesViews;
    });
  }, [streams, filters]);

  // Calculate max views for slider
  const maxViews = useMemo(() => {
    if (streams.length === 0) return 1000;
    return Math.max(...streams.map(s => s.views), 100);
  }, [streams]);

  const hasLiveStreams = filteredStreams.length > 0;

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
      {streams.length > 0 && (
        <>
          <LiveSectionHeader gridLayout={gridLayout} setGridLayout={setGridLayout} />
          <LiveFilters 
            filters={filters} 
            onFiltersChange={setFilters}
            maxViews={maxViews}
          />
        </>
      )}
      
      {hasLiveStreams ? (
        <>
          {gridLayout === "1x1" ? (
            <LiveVideoList 
              videos={filteredStreams} 
              showLeftButton={showLeftButton} 
              isHovering={isHovering} 
              onScroll={handleScroll} 
              onScrollLeft={() => scrollVideos('left')} 
              onScrollRight={() => scrollVideos('right')} 
              ref={scrollContainerRef} 
            />
          ) : (
            <LiveVideoGrid 
              videos={filteredStreams} 
              gridLayout={gridLayout} 
              getGridClass={getGridClass} 
            />
          )}
        </>
      ) : streams.length > 0 ? (
        <div className="px-4 pb-6 pt-4 text-center text-muted-foreground">
          <p>No streams match your filters. Try adjusting your search criteria.</p>
        </div>
      ) : (
        <LiveEmptyState />
      )}
    </div>
  );
};
export default LiveNowSection;