
import React from 'react';
import LoginForm from '@/components/auth/LoginForm';
import LoginLogo from '@/components/auth/LoginLogo';
import DeveloperLockoutOverlay from '@/components/auth/DeveloperLockoutOverlay';
import { GlobalSkeleton } from '@/components/ui/GlobalSkeleton';
import { useWebsiteSettingsLegacy as useWebsiteSettings } from '@/hooks/useWebsiteSettings';

const Login = () => {
  const { isDeveloperMode, loading, countdownEnabled, returnTimeHours } = useWebsiteSettings();

  console.log('🔐 LOGIN: Rendering', { isDeveloperMode, loading });
  console.log('🔐 LOGIN: Failsafe exists?', !!document.getElementById('boot-failsafe'));

  // Show maintenance overlay if developer mode is enabled (but don't block login if loading)
  if (isDeveloperMode && !loading) {
    return (
      <DeveloperLockoutOverlay 
        showCountdown={countdownEnabled} 
        returnTimeHours={returnTimeHours} 
      />
    );
  }

  console.log('🔐 LOGIN: Rendering form');
  
  // Always show login page immediately - don't wait for settings
  // CRITICAL: z-index must be higher than failsafe (999999) to be visible
  return (
    <div className="h-screen w-screen fixed inset-0 flex flex-col md:flex-row overflow-hidden bg-white" style={{ zIndex: 10000000 }}>
      {/* Left side with rich red gradient background - hidden on small screens */}
      <div className="hidden md:flex flex-1 flex-col justify-center items-start px-8 lg:px-16 bg-gradient-to-r from-red-500 via-red-600 to-red-900 relative">
        {/* Metallic highlight overlay for glossy effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-400/30 via-transparent to-red-950/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-red-500/10 to-transparent"></div>
      </div>
      
      {/* Right side login form with logo at the top - responsive width */}
      <div className="w-full md:w-[480px] lg:w-[510px] bg-white flex flex-col">
        <div className="pt-6 md:pt-8 px-4 md:px-8">
          <LoginLogo />
        </div>
        <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;
