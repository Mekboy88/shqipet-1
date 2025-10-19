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
          <div 
            onClick={() => setDarkMode(isDarkMode ? 'light' : 'dark')}
            className={`relative flex items-center gap-0 rounded-full p-0.5 transition-colors duration-[1200ms] cursor-pointer ${!isDarkMode ? 'bg-blue-500' : 'bg-slate-700'}`}
          >
            {/* Sliding indicator */}
            <div 
              className={`absolute h-7 w-7 rounded-full bg-white/80 backdrop-blur-sm transition-transform duration-[1200ms] ease-in-out ${
                isDarkMode ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
            
            <button 
              className={`relative z-10 p-1.5 rounded-full transition-colors duration-[1200ms] ${
                !isDarkMode ? 'text-blue-600' : 'text-white'
              }`}
            >
              <Sun className="h-4 w-4" />
            </button>
            <button 
              className={`relative z-10 p-1.5 rounded-full transition-colors duration-[1200ms] ${
                isDarkMode ? 'text-slate-700' : 'text-white'
              }`}
            >
              <Moon className="h-4 w-4" />
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