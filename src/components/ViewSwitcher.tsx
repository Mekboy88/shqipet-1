import React from 'react';
import { BrowserRouter } from 'react-router-dom';
// Removed toast system - using notification system instead
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// AuthProvider is now handled at App.tsx level - removed duplicate
import { AuthProvider } from "@/contexts/AuthContext";
import { VideoSettingsProvider } from "@/contexts/VideoSettingsContext";
import { PostsProvider } from "@/contexts/PostsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PublishingProgressProvider } from "@/contexts/PublishingProgressContext";

import LaptopApp from '@/components/apps/LaptopApp';
import DesktopApp from '@/components/apps/DesktopApp';
import TermsOfUse from '@/pages/TermsOfUse';
import SafetyWrapper from '@/components/SafetyWrapper';
import RootLoadingWrapper from '@/components/RootLoadingWrapper';
import CentralizedAuthGuard from '@/components/auth/CentralizedAuthGuard';
import GlobeLoader from '@/components/ui/GlobeLoader';
import RoutePersistence from '@/components/routing/RoutePersistence';
import GlobalScrollIndicator from '@/components/ui/GlobalScrollIndicator';


// Import unified responsive styles
import '@/styles/responsive.css';
import '@/styles/mobile.css';
import '@/styles/desktop.css';

// Use standard query client for now
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Check if device should be redirected to mobile app based on REAL device type
const shouldRedirectToMobileApp = (isRealMobile: boolean, isRealTablet: boolean): boolean => {
  // NEVER redirect desktop browsers - even if window is small
  const userAgent = navigator.userAgent.toLowerCase();
  const isDesktopBrowser = userAgent.includes('macintosh') || 
                          userAgent.includes('windows') || 
                          userAgent.includes('linux') ||
                          userAgent.includes('safari') && !userAgent.includes('mobile');
  
  if (isDesktopBrowser) {
    console.log('Desktop browser detected - preventing mobile redirect:', userAgent);
    return false;
  }
  
  return isRealMobile || isRealTablet;
};

// Check if current page is a public page
const isPublicPage = (pathname: string): boolean => {
  try {
    return pathname === '/terms-of-use' || pathname === '/privacy-policy';
  } catch (error) {
    console.warn('Public page check failed:', error);
    return false;
  }
};

const ViewSwitcher: React.FC = () => {
  // Fallback device detection without hooks for initial render
  const getBasicDeviceInfo = () => {
    try {
      const userAgent = navigator.userAgent.toLowerCase();
      const isDesktopBrowser = userAgent.includes('macintosh') || 
                              userAgent.includes('windows') || 
                              userAgent.includes('linux') ||
                              (userAgent.includes('safari') && !userAgent.includes('mobile'));
      
      const mobileKeywords = ['iphone','ipod','android','blackberry','windows phone','mobile','webos','opera mini'];
      const tabletKeywords = ['ipad','android tablet','kindle','silk','playbook','tablet'];
      const isMobileUA = mobileKeywords.some(k => userAgent.includes(k));
      const isTabletUA = tabletKeywords.some(k => userAgent.includes(k));
      
      return {
        isRealMobile: isMobileUA && !isTabletUA,
        isRealTablet: isTabletUA,
        isRealDesktop: isDesktopBrowser
      };
    } catch (error) {
      console.warn('Basic device detection failed:', error);
      return { isRealMobile: false, isRealTablet: false, isRealDesktop: true };
    }
  };

  // Use basic device info for now - will enhance with hooks after React is stable
  const deviceInfo = getBasicDeviceInfo();
  
  const getWindowSize = () => {
    try {
      if (typeof window !== 'undefined') {
        return {
          width: window.innerWidth,
          height: window.innerHeight
        };
      }
    } catch (error) {
      console.warn('Window size detection failed:', error);
    }
    return { width: 1280, height: 720 };
  };
  
  const windowSize = getWindowSize();

  // Safe domain detection with error handling
  const currentPath = (() => {
    try {
      return typeof window !== 'undefined' ? window.location.pathname : '/';
    } catch (error) {
      console.warn('Path detection failed:', error);
      return '/';
    }
  })();
  
  const isOnPublicPage = isPublicPage(currentPath);

  // If we're on a public page, render it directly with error boundary
  if (isOnPublicPage) {
    try {
      return (
        <SafetyWrapper>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <BrowserRouter>
                <div className="min-h-screen bg-gray-50">
                  <RoutePersistence />
                  <TermsOfUse />
                  <GlobalScrollIndicator />
                  {/* Removed toast system - using notification system */}
                </div>
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </SafetyWrapper>
      );
    } catch (error) {
      console.error('Public page render error:', error);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <GlobeLoader size="lg" showText={true} />
        </div>
      );
    }
  }

  // Use real device type - desktop browsers NEVER redirect regardless of window size
  const shouldRedirect = shouldRedirectToMobileApp(deviceInfo.isRealMobile, deviceInfo.isRealTablet);
  
  // Determine layout type based on real device + window size
  const getLayoutType = () => {
    // ABSOLUTE PREVENTION: Never allow mobile layout on desktop browsers
    const userAgent = navigator.userAgent.toLowerCase();
    const isDesktopBrowser = userAgent.includes('macintosh') || 
                            userAgent.includes('windows') || 
                            userAgent.includes('linux') ||
                            (userAgent.includes('safari') && !userAgent.includes('mobile'));
    
    if (isDesktopBrowser) {
      // Desktop browsers: choose between laptop/desktop only, NEVER mobile
      if (windowSize.width >= 1280) return 'desktop';
      return 'laptop'; // Minimum layout for desktop browsers
    }
    
    // Real mobile devices always get redirected
    if (deviceInfo.isRealMobile || deviceInfo.isRealTablet) {
      return 'mobile'; // This will trigger redirect
    }
    
    // Fallback for other devices
    if (windowSize.width >= 1280) return 'desktop';
    if (windowSize.width >= 1024) return 'laptop';
    return 'laptop';
  };
  
  const layoutType = getLayoutType();

  // Get the app component with error handling (only for non-redirected devices)
  const getAppComponent = () => {
    try {
      // Only handle laptop and desktop layouts for desktop browsers
      switch(layoutType) {
        case 'laptop':
          return LaptopApp;
        case 'desktop':
          return DesktopApp;
        default:
          return DesktopApp;
      }
    } catch (error) {
      console.error('App component selection failed:', error);
      return DesktopApp;
    }
  };
  
  const AppComponent = getAppComponent();

  // Don't block render on mobile/tablet – always render app to avoid blank screen
  if (shouldRedirect) {
    console.warn('ViewSwitcher: Mobile/tablet detected; rendering desktop app to avoid blank screen');
    // Intentionally fall through to render AppComponent
  }


  // Main render with comprehensive error handling
  try {
    return (
      <RootLoadingWrapper>
        <SafetyWrapper>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <VideoSettingsProvider>
                <ThemeProvider>
                  <TooltipProvider>
                    <BrowserRouter>
                      <RoutePersistence />
                      <CentralizedAuthGuard>
                        <PostsProvider>
                           <PublishingProgressProvider>
                             <div className={`app-container is-${layoutType}-view vw-100 vh-100`} data-auth-ready>
                               <AppComponent />
                             </div>
                             <GlobalScrollIndicator />
                             {/* Removed toast system - using notification system */}
                           </PublishingProgressProvider>
                        </PostsProvider>
                      </CentralizedAuthGuard>
                    </BrowserRouter>
                  </TooltipProvider>
                </ThemeProvider>
              </VideoSettingsProvider>
            </QueryClientProvider>
          </AuthProvider>
        </SafetyWrapper>
      </RootLoadingWrapper>
    );
  } catch (error) {
    console.error('ViewSwitcher render error:', error);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <GlobeLoader size="lg" showText={true} />
        </div>
      );
  }
};

export default ViewSwitcher;