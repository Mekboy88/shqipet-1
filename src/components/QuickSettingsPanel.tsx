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
          <div className={`relative flex items-center gap-0 rounded-full p-0.5 transition-colors ${!isDarkMode ? 'bg-blue-500' : 'bg-slate-700'}`}>
            {/* Sliding indicator */}
            <div 
              className={`absolute h-7 w-7 rounded-full bg-white/80 backdrop-blur-sm transition-transform duration-300 ease-in-out ${
                isDarkMode ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
            
            <button 
              onClick={() => setDarkMode('light')}
              className={`relative z-10 p-1.5 rounded-full transition-colors duration-300 ${
                !isDarkMode ? 'text-blue-600' : 'text-white'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6.797a3.191 3.191 0 0 0-3.2 3.201 3.19 3.19 0 0 0 3.2 3.199 3.19 3.19 0 0 0 3.199-3.199A3.19 3.19 0 0 0 10 6.797zm0 5.25a2.049 2.049 0 1 1 0-4.1 2.05 2.05 0 0 1 0 4.1zM15 5c-.312-.312-.883-.248-1.273.142-.39.391-.453.959-.141 1.272s.882.25 1.273-.141c.39-.39.453-.961.141-1.273zm-9.858 8.729c-.391.39-.454.959-.142 1.271s.882.25 1.273-.141.454-.961.142-1.273-.883-.248-1.273.143zM5 5c-.312.312-.249.883.141 1.273.391.391.961.453 1.273.141s.249-.883-.142-1.273C5.883 4.752 5.312 4.688 5 5zm8.727 9.857c.39.391.96.455 1.273.143s.249-.883-.142-1.274-.96-.453-1.273-.141-.248.882.142 1.272zM10 4.998c.441 0 .8-.447.8-1C10.799 3.445 10.441 3 10 3c-.442 0-.801.445-.801.998s.358 1 .801 1zM10 17c.441 0 .8-.447.8-1s-.358-.998-.799-.998c-.442 0-.801.445-.801.998-.001.553.357 1 .8 1zm-5-7c0-.441-.45-.8-1.003-.8S3 9.559 3 10c0 .442.444.8.997.8S5 10.442 5 10zm12 0c0-.441-.448-.8-1.001-.8-.553 0-.999.359-.999.8 0 .442.446.8.999.8.553 0 1.001-.358 1.001-.8z" />
              </svg>
            </button>
            <button 
              onClick={() => setDarkMode('dark')}
              className={`relative z-10 p-1.5 rounded-full transition-colors duration-300 ${
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