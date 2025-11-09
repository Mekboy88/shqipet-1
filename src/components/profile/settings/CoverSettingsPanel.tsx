import React from 'react';
import { X } from 'lucide-react';

interface CoverSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  buttonColor: string;
  onButtonColorChange: (color: string) => void;
}

const CoverSettingsPanel: React.FC<CoverSettingsPanelProps> = ({
  isOpen,
  onClose,
  buttonColor,
  onButtonColorChange,
}) => {
  const colorOptions = [
    { name: 'White (transparent)', value: 'rgba(255, 255, 255, 0.1)', description: 'A subtle white overlay that blends naturally with your cover photo' },
    { name: 'Dark', value: 'rgba(0, 0, 0, 0.5)', description: 'A semi-transparent dark overlay for better text contrast' },
    { name: 'Blue', value: 'rgba(59, 130, 246, 0.7)', description: 'A vibrant blue tone that adds a professional touch' },
    { name: 'Green', value: 'rgba(34, 197, 94, 0.7)', description: 'A fresh green color representing growth and energy' },
    { name: 'Red', value: 'rgba(239, 68, 68, 0.7)', description: 'A bold red accent that draws attention' },
    { name: 'Purple', value: 'rgba(168, 85, 247, 0.7)', description: 'A creative purple shade for a unique look' },
  ];

  return (
    <div 
      className={`transition-all duration-500 ease-in-out ${
        isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      {/* Border Line */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-4" />
      
      <div className="bg-card border border-border rounded-lg p-6 space-y-6 overflow-y-auto max-h-[700px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cover Photo Settings</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Introduction Text */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Customize how your cover photo appears on your profile. These settings help you create the perfect presentation for visitors to your profile.
          </p>
        </div>

        {/* Button Color Settings */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <svg viewBox="0 0 1024 1024" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                <path d="M539.4 550.9m-164.7 0a164.7 164.7 0 1 0 329.4 0 164.7 164.7 0 1 0-329.4 0Z" fill="currentColor"/>
                <path d="M679.3 405.4c-8.9-14-27.4-18.2-41.4-9.3-14 8.9-18.2 27.4-9.3 41.4 14 22.1 21.4 47.7 21.4 74 0 16.6 13.4 30 30 30s30-13.4 30-30c0-37.7-10.6-74.4-30.7-106.1z" fill="currentColor"/>
              </svg>
              Professional Presentation Button Color
            </h4>
            <p className="text-xs text-muted-foreground">
              Choose the background color for your "Prezantimi profesional" button. This button appears on your cover photo and links to your professional presentation page. Select a color that complements your cover photo and ensures the button stands out.
            </p>
          </div>

          {/* Color Options Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onButtonColorChange(option.value)}
                className={`flex flex-col items-start p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                  buttonColor === option.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3 w-full mb-2">
                  <div
                    className="w-10 h-10 rounded-md border-2 border-white/30 flex-shrink-0"
                    style={{ backgroundColor: option.value }}
                  />
                  <span className="text-sm font-medium">{option.name}</span>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="text-sm font-semibold">How to use these settings:</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><strong>Select a color</strong> by clicking on one of the options above. The change will be applied immediately.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><strong>Preview your selection</strong> by looking at your cover photo above. The button color will update in real-time.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><strong>Choose wisely</strong> – pick a color that contrasts well with your cover photo for better visibility.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><strong>Changes are saved automatically</strong> and will be visible to anyone who visits your profile.</span>
            </li>
          </ul>
        </div>

        {/* Tip Section */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="text-sm font-semibold">Pro Tip</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            If your cover photo has dark tones, try using lighter button colors (White or Blue) for better contrast. 
            For lighter cover photos, darker colors (Dark or Purple) work best to make the button stand out.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoverSettingsPanel;
