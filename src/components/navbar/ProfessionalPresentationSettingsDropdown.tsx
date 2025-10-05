import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ChevronRight, ChevronDown } from "lucide-react";

interface ProfessionalPresentationSettingsDropdownProps {
  editMode: boolean;
  setEditMode: (value: boolean) => void;
  sections: {
    home: boolean;
    skills: boolean;
    portfolio: boolean;
    blogs: boolean;
    contact: boolean;
  };
  setSections: React.Dispatch<React.SetStateAction<{
    home: boolean;
    skills: boolean;
    portfolio: boolean;
    blogs: boolean;
    contact: boolean;
  }>>;
}

const ProfessionalPresentationSettingsIcon: React.FC<{ className?: string; size?: number }> = ({ 
  className = "", 
  size = 24 
}) => {
  return (
    <svg 
      height={size} 
      width={size} 
      version="1.1" 
      viewBox="0 0 512 512" 
      className={className}
    >
      <path 
        style={{ fill: "#2D2D2D" }} 
        d="M0,376V52c0.104-5.704,4.696-10.296,10.4-10.4h491.2c5.704,0.104,10.296,4.696,10.4,10.4v324H0z"
      />
      <g>
        <path 
          style={{ fill: "#BCBCBC" }} 
          d="M512,376v41.6c-0.104,5.704-4.696,10.296-10.4,10.4H10.4c-5.704-0.104-10.296-4.696-10.4-10.4V376 H512z"
        />
        <rect x="146.4" y="501.6" style={{ fill: "#BCBCBC" }} width="219.2" height="10.4" />
      </g>
      <polygon 
        style={{ fill: "#2D2D2D" }} 
        points="328.8,501.6 183.2,501.6 193.6,428 318.4,428"
      />
      <rect x="20.8" y="62.4" style={{ fill: "#FFFFFF" }} width="470.4" height="292.8" />
      <polygon points="318.4,428 193.6,428 187.792,469.08 320.272,441.224" />
      <polygon 
        style={{ fill: "#D8D6D6" }} 
        points="90.12,331.76 183.12,307.424 421.88,68.664 353.216,0 114.456,238.76"
      />
      <polyline 
        style={{ fill: "#6B6B6B" }} 
        points="103.464,280.76 90.12,331.76 141.12,318.416"
      />
      <rect 
        x="344.2" 
        y="23.948" 
        transform="matrix(0.7071 -0.7071 0.7071 0.7071 51.0675 268.286)" 
        width="10.368" 
        height="97.103"
      />
      <rect 
        x="104.524" 
        y="117.627" 
        transform="matrix(0.7071 -0.7071 0.7071 0.7071 -42.6179 229.4677)" 
        width="302.317" 
        height="97.103"
      />
      <rect 
        x="334.698" 
        y="7.671" 
        transform="matrix(0.7071 -0.7071 0.7071 0.7071 67.3419 275.0236)" 
        style={{ fill: "#E21B1B" }} 
        width="61.911" 
        height="97.103"
      />
      <g style={{ opacity: 0.25 }}>
        <polygon 
          style={{ fill: "#FFFFFF" }} 
          points="90.12,331.76 388.832,35.616 353.216,0.008 114.496,238.72"
        />
      </g>
      <g>
        <polygon 
          style={{ fill: "#666666" }} 
          points="172.744,296.968 170.912,295.128 200.512,265.528 200.512,252.576 261.952,191.144 278.352,191.144 323.6,145.896 344.504,145.896 342.04,148.488 324.672,148.488 279.424,193.736 263.024,193.736 203.104,253.648 203.104,266.6"
        />
        <polygon 
          style={{ fill: "#666666" }} 
          points="126.256,250.536 124.424,248.704 234.408,138.76 234.408,130.384 292.856,71.944 292.856,60.368 295.448,57.848 295.448,73.016 237,131.456 237,139.832"
        />
      </g>
    </svg>
  );
};

const ProfessionalPresentationSettingsDropdown: React.FC<ProfessionalPresentationSettingsDropdownProps> = ({ 
  editMode, 
  setEditMode,
  sections,
  setSections
}) => {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [sectionsExpanded, setSectionsExpanded] = useState(false);

  return (
    <div className="relative my-0 py-0 mx-0 mt-1 mr-2">
      <TooltipProvider delayDuration={0}>
        <Tooltip open={showTooltip}>
          <Popover open={open} onOpenChange={setOpen}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button 
                  className="h-10 w-10 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-100 flex items-center justify-center"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <ProfessionalPresentationSettingsIcon size={20} />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            
            <PopoverContent 
              className="w-80 p-0 rounded-xl shadow-lg border-none z-[1000]" 
              align="end" 
              sideOffset={12}
            >
              <div className="bg-white rounded-xl overflow-hidden text-gray-800">
                <div className="p-4 space-y-2">
                  {/* Edit Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700">Edit Mode</span>
                    <Switch checked={editMode} onCheckedChange={setEditMode} />
                  </div>

                  {/* Sections Button with Arrow */}
                  <div className="border-t pt-2">
                    <button
                      onClick={() => setSectionsExpanded(!sectionsExpanded)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm font-medium text-neutral-700">Sections</span>
                      {sectionsExpanded ? (
                        <ChevronDown className="h-4 w-4 text-neutral-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-neutral-500" />
                      )}
                    </button>

                    {/* Section Toggles - Expanded View */}
                    {sectionsExpanded && (
                      <div className="mt-2 space-y-2 pl-2">
                        {[
                          ["Home", "home"],
                          ["Skills", "skills"],
                          ["Portfolio", "portfolio"],
                          ["Blogs", "blogs"],
                          ["Contact", "contact"]
                        ].map(([label, key]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                          >
                            <span className="text-sm text-neutral-700">{label}</span>
                            <Switch
                              checked={(sections as any)[key]}
                              onCheckedChange={(v) =>
                                setSections({
                                  ...sections,
                                  [key]: v
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </PopoverContent>

            <TooltipContent side="bottom" className="bg-gray-800 text-white px-2 py-1 text-xs rounded">
              Professional Presentation Settings
            </TooltipContent>
          </Popover>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ProfessionalPresentationSettingsDropdown;
