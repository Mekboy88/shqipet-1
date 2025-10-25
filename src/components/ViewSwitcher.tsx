import React, { useEffect, useState } from 'react';
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

import { isPrimaryDomain, isMobileSubdomain, buildUrlFor, isAdminPath, MOBILE_SUBDOMAIN, PRIMARY_DOMAINS } from '@/utils/domainConfig';
import { supabase } from '@/integrations/supabase/client';
import { DesktopMobileToggle } from './DesktopMobileToggle';


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
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Mobile redirect logic - runs once on mount
  useEffect(() => {
    // Skip if already redirected in this session
    if (sessionStorage.getItem('mobileRedirectChecked') === '1') return;
    
    try {
      const hostname = window.location.hostname;
      const pathname = window.location.pathname;
      
      // Skip redirect for admin paths
      if (isAdminPath(pathname)) {
        sessionStorage.setItem('mobileRedirectChecked', '1');
        return;
      }
      
      // Check override conditions
      const urlParams = new URLSearchParams(window.location.search);
      const forceDesktop = urlParams.get('forceDesktop') === '1';
      const prefersDesktop = localStorage.getItem('prefersDesktop') === '1';
      
      if (forceDesktop || prefersDesktop) {
        sessionStorage.setItem('mobileRedirectChecked', '1');
        return;
      }
      
      // Detect device
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['iphone','ipod','android','blackberry','windows phone','mobile','webos','opera mini'];
      const tabletKeywords = ['ipad','android tablet','kindle','silk','playbook','tablet'];
      const isMobileUA = mobileKeywords.some(k => userAgent.includes(k));
      const isTabletUA = tabletKeywords.some(k => userAgent.includes(k));
      const isRealMobile = isMobileUA && !isTabletUA;
      const isRealTablet = isTabletUA;

      // Robust desktop detection: real Macs/Windows/Linux (exclude iPadOS masquerading as Mac by checking touch points)
      const isMacDesktop = (userAgent.includes('macintosh') || userAgent.includes('mac os x')) && (navigator.maxTouchPoints || 0) < 2;
      const isWindowsDesktop = userAgent.includes('windows nt');
      const isLinuxDesktop = userAgent.includes('linux') && !userAgent.includes('android');
      const isDesktopBrowser = isMacDesktop || isWindowsDesktop || isLinuxDesktop || (userAgent.includes('safari') && !userAgent.includes('mobile'));
      
      // Mobile/Tablet on primary domain → redirect to m.shqipet.com (but NEVER for real desktop browsers)
      if ((isRealMobile || isRealTablet) && !isDesktopBrowser && isPrimaryDomain(hostname)) {
        sessionStorage.setItem('mobileRedirectChecked', '1');
        setIsRedirecting(true);
        const targetUrl = buildUrlFor(MOBILE_SUBDOMAIN);
        console.log('Redirecting mobile/tablet user to:', targetUrl);
        
        // Log redirect to database if user is authenticated
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase.from('profiles').update({
              last_device: isRealMobile ? 'mobile' : 'tablet',
              last_redirect_host: MOBILE_SUBDOMAIN,
              last_redirect_at: new Date().toISOString()
            }).eq('id', user.id).then(() => {
              window.location.replace(targetUrl);
            }).catch(() => {
              window.location.replace(targetUrl);
            });
          } else {
            window.location.replace(targetUrl);
          }
        }).catch(() => {
          window.location.replace(targetUrl);
        });
        return;
      }
      
      // Desktop on mobile subdomain → redirect back to primary
      if (isDesktopBrowser && isMobileSubdomain(hostname)) {
        sessionStorage.setItem('mobileRedirectChecked', '1');
        setIsRedirecting(true);
        const targetUrl = buildUrlFor(PRIMARY_DOMAINS[0]);
        console.log('Redirecting desktop user to:', targetUrl);
        
        // Log redirect to database if user is authenticated
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase.from('profiles').update({
              last_device: 'desktop',
              last_redirect_host: PRIMARY_DOMAINS[0],
              last_redirect_at: new Date().toISOString()
            }).eq('id', user.id).then(() => {
              window.location.replace(targetUrl);
            }).catch(() => {
              window.location.replace(targetUrl);
            });
          } else {
            window.location.replace(targetUrl);
          }
        }).catch(() => {
          window.location.replace(targetUrl);
        });
        return;
      }
      
      sessionStorage.setItem('mobileRedirectChecked', '1');
    } catch (error) {
      console.warn('Mobile redirect check failed:', error);
      sessionStorage.setItem('mobileRedirectChecked', '1');
    }
  }, []);

  // Show loading while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <GlobeLoader size="lg" showText={true} />
      </div>
    );
  }

  // Fallback device detection without hooks for initial render
  const getBasicDeviceInfo = () => {
    try {
      const userAgent = navigator.userAgent.toLowerCase();
      // Robust desktop detection as above
      const isMacDesktop = (userAgent.includes('macintosh') || userAgent.includes('mac os x')) && (navigator.maxTouchPoints || 0) < 2;
      const isWindowsDesktop = userAgent.includes('windows nt');
      const isLinuxDesktop = userAgent.includes('linux') && !userAgent.includes('android');
      const isDesktopBrowser = isMacDesktop || isWindowsDesktop || isLinuxDesktop || (userAgent.includes('safari') && !userAgent.includes('mobile'));
      
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

  // Determine layout type based on real device + window size
  const getLayoutType = () => {
    // Desktop browsers: choose between laptop/desktop based on screen size
    const userAgent = navigator.userAgent.toLowerCase();
    const isDesktopBrowser = userAgent.includes('macintosh') || 
                            userAgent.includes('windows') || 
                            userAgent.includes('linux') ||
                            (userAgent.includes('safari') && !userAgent.includes('mobile'));
    
    if (isDesktopBrowser) {
      // Desktop browsers: laptop or desktop based on width
      if (windowSize.width >= 1280) return 'desktop';
      return 'laptop';
    }
    
    // Mobile/tablet devices: use laptop layout (it's responsive)
    if (deviceInfo.isRealMobile || deviceInfo.isRealTablet) {
      return 'laptop';
    }
    
    // Fallback for other devices
    if (windowSize.width >= 1280) return 'desktop';
    if (windowSize.width >= 1024) return 'laptop';
    return 'laptop';
  };
  
  const layoutType = getLayoutType();

  // Get the app component with error handling
  const getAppComponent = () => {
    try {
      switch(layoutType) {
        case 'laptop':
          return LaptopApp;
        case 'desktop':
          return DesktopApp;
        default:
          return LaptopApp;
      }
    } catch (error) {
      console.error('App component selection failed:', error);
      return LaptopApp;
    }
  };
  
  const AppComponent = getAppComponent();


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
                               <DesktopMobileToggle />
                             </div>
                             
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