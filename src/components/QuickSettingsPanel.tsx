import React, { useState } from "react";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { useTheme } from "@/contexts/ThemeContext";

interface QuickSettingsPanelProps {
  onBack: () => void;
}

const QuickSettingsPanel: React.FC<QuickSettingsPanelProps> = ({ onBack }) => {
  const { darkMode, setDarkMode } = useTheme();
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showLastSeen, setShowLastSeen] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState(true);

  const handlePrivacyClick = () => {
    // Navigate to privacy settings - you can implement this
    console.log("Opening privacy settings");
  };

  const isDarkMode = darkMode === 'dark';

  return (
    <div className="absolute inset-0 bg-background rounded-xl text-foreground animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1 hover:bg-accent rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold">Cilësimet e Shpejta</h2>
        </div>
      </div>

      <div className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100% - 120px)' }}>
        {/* Appearance Section */}
        <div className="space-y-3">
          <h3 className="text-base font-medium">Appearance</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Choose between light and dark theme</p>
            </div>
            <div className={`flex items-center gap-1 rounded-full px-0.5 py-0.5 transition-colors ${!isDarkMode ? 'bg-blue-500' : 'bg-slate-700'}`}>
              <button 
                onClick={() => setDarkMode('light')}
                className={`p-1 rounded-full transition-colors ${!isDarkMode ? 'bg-white text-blue-500' : 'text-white'}`}
              >
                <Sun className="h-3 w-3" />
              </button>
              <button 
                onClick={() => setDarkMode('dark')}
                className={`p-1 rounded-full transition-colors ${isDarkMode ? 'bg-white text-slate-700' : 'text-white'}`}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5">
                  <path d="M13.589 21.659c-3.873 1.038-8.517-.545-10.98-3.632a1 1 0 0 1 .751-1.623c3.984-.118 6.662-1.485 8.17-4.098 1.51-2.613 1.354-5.616-.535-9.125a1 1 0 0 1 1.03-1.463c3.904.59 7.597 3.82 8.635 7.694 1.43 5.334-1.737 10.818-7.071 12.247z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Activity Status Section */}
        <div className="space-y-3">
          <h3 className="text-base font-medium">Activity Status</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">Show Online Status</p>
              <p className="text-xs text-muted-foreground">Let others see when you're active</p>
            </div>
            <Switch 
              checked={showOnlineStatus} 
              onCheckedChange={setShowOnlineStatus}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">Last Seen</p>
              <p className="text-xs text-muted-foreground">Show when you were last active</p>
            </div>
            <Switch 
              checked={showLastSeen} 
              onCheckedChange={setShowLastSeen}
            />
          </div>
        </div>

        <Separator />

        {/* Account Privacy Section */}
        <div className="space-y-3">
          <h3 className="text-base font-medium">Account Privacy</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">Private Account</p>
              <p className="text-xs text-muted-foreground">Only followers can see your posts</p>
            </div>
            <Switch 
              checked={privateAccount} 
              onCheckedChange={setPrivateAccount}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">Profile Visibility</p>
              <p className="text-xs text-muted-foreground">Show your profile in search results</p>
            </div>
            <Switch 
              checked={profileVisibility} 
              onCheckedChange={setProfileVisibility}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>
        </div>

        <Separator />

        {/* Privacy & Security Section */}
        <div className="space-y-3">
          <h3 className="text-base font-medium">Privacy & Security</h3>
          
          <div 
            onClick={handlePrivacyClick}
            className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors"
          >
            <div className="flex-1">
              <p className="text-sm font-medium">Informacioni i Privatësisë</p>
              <p className="text-xs text-muted-foreground">Manage your privacy and security preferences</p>
            </div>
            <span className="text-sm text-blue-600 font-medium">Open</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickSettingsPanel;