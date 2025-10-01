
import React from "react";
import GridLayoutButtons from "./GridLayoutButtons";

interface LiveSectionHeaderProps {
  gridLayout: "1x1" | "2x2" | "3x3" | "4x4";
  setGridLayout: (layout: "1x1" | "2x2" | "3x3" | "4x4") => void;
}

const LiveSectionHeader: React.FC<LiveSectionHeaderProps> = ({
  gridLayout,
  setGridLayout
}) => {
  return (
    <div className="flex items-center justify-between p-0 m-0 leading-none -my-2">
      <div className="flex items-center p-0 m-0 -my-1">
        <img 
          src="/lovable-uploads/000cd69b-d89a-47e6-b058-00eea5802863.png" 
          alt="Direkt Tani" 
          className="h-20 w-auto block p-0 m-0 -my-1"
        />
      </div>
      
      <GridLayoutButtons 
        gridLayout={gridLayout} 
        setGridLayout={setGridLayout} 
      />
    </div>
  );
};

export default LiveSectionHeader;
