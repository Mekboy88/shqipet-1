import React, { useEffect, useState, lazy, Suspense } from 'react';
import { HashRouter } from 'react-router-dom';
// Removed toast system - using notification system instead
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// AuthProvider is now handled at App.tsx level - removed duplicate
import { AuthProvider } from "@/contexts/AuthContext";
import { VideoSettingsProvider } from "@/contexts/VideoSettingsContext";
import { PostsProvider } from "@/contexts/PostsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PublishingProgressProvider } from "@/contexts/PublishingProgressContext";

// Lazy load heavy app components to reduce initial bundle size
const LaptopApp = lazy(() => import('@/components/apps/LaptopApp'));
const DesktopApp = lazy(() => import('@/components/apps/DesktopApp'));
const TermsOfUse = lazy(() => import('@/pages/TermsOfUse'));
import SafetyWrapper from '@/components/SafetyWrapper';
import RootLoadingWrapper from '@/components/RootLoadingWrapper';
import CentralizedAuthGuard from '@/components/auth/CentralizedAuthGuard';
import { GlobalSkeleton } from '@/components/ui/GlobalSkeleton';
import RoutePersistence from '@/components/routing/RoutePersistence';
import GlobalScrollIndicator from '@/components/ui/GlobalScrollIndicator';
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
  
  // Boot diagnostics
  console.time('APP_BOOT');

  // Hard-disable any mobile subdomain redirects globally
  useEffect(() => {
    try {
      sessionStorage.setItem('mobileRedirectChecked', '1');
      console.info('✅ ViewSwitcher: Mobile redirects hard-disabled');
    } catch {}
  }, []);

  // Mobile redirect logic - DISABLED BY DEFAULT (opt-in only)
  useEffect(() => {
    // Skip if already redirected in this session
    if (sessionStorage.getItem('mobileRedirectChecked') === '1') return;
    
    try {
      const hostname = window.location.hostname;
      const pathname = window.location.pathname;
      
      console.info('🔍 ViewSwitcher: Checking redirect conditions', { hostname, pathname });
      
      // Skip redirect for admin paths
      if (isAdminPath(pathname)) {
        console.info('✅ ViewSwitcher: Admin path, skipping mobile redirect');
        sessionStorage.setItem('mobileRedirectChecked', '1');
        return;
      }
      
      // CRITICAL: Mobile subdomain redirect is DISABLED by default
      // Users must explicitly enable it with: localStorage.setItem('enableMobileSubdomain', '1')
      const enableMobileSubdomain = localStorage.getItem('enableMobileSubdomain') === '1';
      
      if (!enableMobileSubdomain) {
        console.info('✅ ViewSwitcher: Mobile subdomain redirect disabled (default), staying on current domain');
        sessionStorage.setItem('mobileRedirectChecked', '1');
        return;
      }
      
      // Check override conditions
      const urlParams = new URLSearchParams(window.location.search);
      const forceDesktop = urlParams.get('forceDesktop') === '1';
      const prefersDesktop = localStorage.getItem('prefersDesktop') === '1';
      
      if (forceDesktop || prefersDesktop) {
        console.info('✅ ViewSwitcher: Desktop override active, skipping mobile redirect');
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
        console.info('🔄 ViewSwitcher: Redirecting mobile/tablet user to:', targetUrl);
        
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
        console.info('🔄 ViewSwitcher: Redirecting desktop user to:', targetUrl);
        
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
      
      console.info('✅ ViewSwitcher: No redirect needed, staying on current domain');
      sessionStorage.setItem('mobileRedirectChecked', '1');
    } catch (error) {
      console.warn('⚠️ ViewSwitcher: Mobile redirect check failed:', error);
      sessionStorage.setItem('mobileRedirectChecked', '1');
    }
  }, []);

  // Show loading while redirecting
  if (isRedirecting) {
    console.log('🔄 Showing shimmer skeleton during redirect');
    return <GlobalSkeleton />;
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

  // Safe path detection with hash routing support
  const getInitialPath = () => {
    try {
      if (typeof window === 'undefined') return '/';
      const hashPath = window.location.hash?.slice(1) || '';
      const path = hashPath || window.location.pathname || '/';
      return path;
    } catch (error) {
      console.warn('Path detection failed:', error);
      return '/';
    }
  };
  
  const currentPath = getInitialPath();
  
  const isOnPublicPage = isPublicPage(currentPath);

  // If we're on a public page, render it directly with error boundary
  if (isOnPublicPage) {
    console.timeEnd('APP_BOOT');
    try {
      return (
        <SafetyWrapper>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <HashRouter>
                <div className="min-h-screen bg-gray-50">
                  <RoutePersistence />
                  <Suspense fallback={<GlobalSkeleton />}>
                    <TermsOfUse />
                  </Suspense>
                  <GlobalScrollIndicator />
                  {/* Removed toast system - using notification system */}
                </div>
              </HashRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </SafetyWrapper>
      );
    } catch (error) {
      console.error('Public page render error:', error);
      return <GlobalSkeleton />;
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
  console.timeEnd('APP_BOOT');
  try {
    return (
      <RootLoadingWrapper>
        <SafetyWrapper>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <VideoSettingsProvider>
                <ThemeProvider>
                  <TooltipProvider>
                    <HashRouter>
                      <RoutePersistence />
                      <CentralizedAuthGuard>
                        <PostsProvider>
                             <PublishingProgressProvider>
                             <div className={`app-container is-${layoutType}-view vw-100 vh-100`} data-auth-ready>
                               <Suspense fallback={<GlobalSkeleton />}>
                                 <AppComponent />
                               </Suspense>
                               <DesktopMobileToggle />
                             </div>
                             <GlobalScrollIndicator />
                             {/* Removed toast system - using notification system */}
                           </PublishingProgressProvider>
                        </PostsProvider>
                      </CentralizedAuthGuard>
                    </HashRouter>
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
    return <GlobalSkeleton />;
  }
};

export default ViewSwitcher;