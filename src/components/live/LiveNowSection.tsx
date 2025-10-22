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
      <div className="mb-4 px-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {t('feed.live_section_title', 'Live Now')}
        </h2>
        <svg height="40px" width="40px" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="mt-2">
          <path style={{fill: '#F4B2B0'}} d="M391.018,380.752H13.34v21.639c0,32.699,26.507,59.205,59.205,59.205h366.908 c32.697,0,59.205-26.507,59.205-59.205v-21.639"/>
          <g>
            <path style={{fill: '#B3404A'}} d="M439.455,474.935H72.545C32.544,474.935,0,442.391,0,402.39V380.75c0-7.367,5.973-13.34,13.34-13.34 h377.678c7.367,0,13.34,5.974,13.34,13.34s-5.974,13.34-13.34,13.34H26.681v8.299c0,25.289,20.575,45.864,45.864,45.864h366.908 c25.291,0,45.866-20.575,45.866-45.864V380.75c0-7.367,5.974-13.34,13.34-13.34c7.367,0,13.34,5.974,13.34,13.34v21.639 C512,442.392,479.456,474.935,439.455,474.935z"/>
            <path style={{fill: '#B3404A'}} d="M439.455,474.935H72.545C32.544,474.935,0,442.391,0,402.39V109.61 c0-40.001,32.544-72.545,72.545-72.545h366.908c40.001,0,72.545,32.544,72.545,72.545v292.781 C511.999,442.392,479.456,474.935,439.455,474.935z M72.545,63.746c-25.289,0-45.864,20.575-45.864,45.864v292.781 c0,25.289,20.575,45.864,45.864,45.864h366.908c25.289,0,45.864-20.575,45.864-45.864V109.61c0-25.289-20.575-45.864-45.864-45.864 H72.545z"/>
          </g>
          <path style={{fill: '#EBAFAE'}} d="M219.511,249.304v-71.591c0-5.667,6.113-9.228,11.042-6.433l63.126,35.795 c4.996,2.833,4.996,10.032,0,12.864l-63.126,35.796C225.623,258.531,219.511,254.97,219.511,249.304z"/>
          <g>
            <path style={{fill: '#B1404A'}} d="M226.915,270.049c-11.438,0-20.744-9.306-20.744-20.746v-71.591 c0-11.439,9.306-20.746,20.744-20.746c3.559,0,7.093,0.936,10.219,2.709l63.126,35.794c6.481,3.677,10.507,10.588,10.507,18.038 c0,7.449-4.026,14.361-10.506,18.036l-63.127,35.796C234.008,269.112,230.474,270.049,226.915,270.049z M232.85,187.92v51.177 l45.127-25.59L232.85,187.92z"/>
            <path style={{fill: '#B1404A'}} d="M256,328.036c-61.79,0-112.06-50.271-112.06-112.06c0-7.367,5.973-13.34,13.34-13.34 s13.34,5.974,13.34,13.34c0,47.078,38.3,85.379,85.379,85.379s85.379-38.3,85.379-85.379s-38.3-85.379-85.379-85.379 c-7.368,0-13.34-5.974-13.34-13.34s5.973-13.34,13.34-13.34c61.789,0,112.06,50.271,112.06,112.06S317.789,328.036,256,328.036z"/>
          </g>
          <path style={{fill: '#B3404A'}} d="M116.147,420.087c-7.368,0-13.34-5.974-13.34-13.34v-52.917c0-7.367,5.972-13.34,13.34-13.34 s13.34,5.974,13.34,13.34v52.917C129.487,414.115,123.515,420.087,116.147,420.087z"/>
        </svg>
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
