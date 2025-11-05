import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GlobalSkeleton } from '@/components/ui/GlobalSkeleton';

interface CentralizedAuthGuardProps {
  children: React.ReactNode;
}

const publicRoutes = [
  '/auth/login', 
  '/landing',
  '/auth/register', 
  '/register', 
  '/auth/verification', 
  '/auth/callback', 
  '/terms-of-use', 
  '/privacy-policy',
  '/auth/forgot-password',
  '/auth/cookies-consent',
  // Public compose routes
  '/create-post',
  '/compose',
  '/post/create',
  // Messages routes
  '/messages',
  '/messages/standalone',
  // Live streams (public viewing)
  '/live'
];

const CentralizedAuthGuard: React.FC<CentralizedAuthGuardProps> = ({ children }) => {
  // Safe auth access with early return
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.warn('CentralizedAuthGuard: Auth context not ready yet');
    return <GlobalSkeleton />;
  }
  
  const { user, loading } = authContext;
  const location = useLocation();
  const [forceRender, setForceRender] = React.useState(false);
  
  // Enhanced logging for debugging
  console.log('🛡️ CentralizedAuthGuard:', {
    loading,
    hasUser: !!user,
    userEmail: user?.email,
    path: location.pathname,
    forceRender,
    timestamp: new Date().toISOString()
  });

  // Reduced timeout and better handling
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('⚠️ CentralizedAuthGuard: Auth taking too long, showing fallback');
        setForceRender(true);
      }
    }, 1500); // Reduced from 3 seconds

    return () => clearTimeout(timeout);
  }, [loading]);

  // Add a useEffect to track loading state changes
  React.useEffect(() => {
    console.log('🔄 CentralizedAuthGuard: Loading state changed to:', loading);
    if (!loading) {
      setForceRender(false); // Reset force render when loading completes normally
    }
  }, [loading]);

  React.useEffect(() => {
    console.log('👤 CentralizedAuthGuard: User state changed to:', !!user, user?.email);
  }, [user]);
  
  // Check if current route is public (handle trailing slashes and nested paths)
  const isPublicRoute = React.useMemo(() => {
    const raw = location.pathname || '/';
    const path = raw !== '/' ? raw.replace(/\/+$/, '') : '/';
    return publicRoutes.some((route) => path === route || path.startsWith(route + '/'));
  }, [location.pathname]);
  // Routes where we must not flash the skeleton (render immediately)
  const noSkeletonRoutes = ['/professional-presentation', '/create-post', '/compose', '/post/create', '/auth/login', '/landing'];
  
  // CRITICAL: Show loading skeleton while auth is still initializing (unless forced)
  if (loading && !forceRender) {
    console.log('⏳ CentralizedAuthGuard: Auth still loading', { path: location.pathname });
    if (noSkeletonRoutes.includes(location.pathname)) {
      // Render page content immediately to avoid flicker on fast paths
      return <>{children}</>;
    }
    return <GlobalSkeleton />;
  }
  
  // If we're force rendering due to timeout, treat as if auth completed
  if (forceRender) {
    console.log('🚨 CentralizedAuthGuard: Force rendering due to timeout');
  }
  // If auth timed out and unauthenticated on protected route, redirect to login
  if (forceRender && !user && !isPublicRoute) {
    console.warn('CentralizedAuthGuard: Fallback redirect after auth timeout → /auth/login', { path: location.pathname });
    try {
      const fullPath = location.pathname + location.search + location.hash;
      sessionStorage.setItem('redirectAfterAuth', fullPath);
    } catch {}
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  // If user is authenticated and on auth pages, redirect to preserved path or home
  // EXCEPTION: allow /auth/cookies-consent even when authenticated (post-registration flow)
  if (
    user &&
    (location.pathname.startsWith('/auth/') || location.pathname === '/welcome') &&
    location.pathname !== '/auth/cookies-consent'
  ) {
    console.log('🔄 CentralizedAuthGuard: Authenticated user on auth page, checking for preserved path');
    const redirectPath = sessionStorage.getItem('redirectAfterAuth');
    if (redirectPath && redirectPath !== '/auth/login' && redirectPath !== '/auth/register') {
      sessionStorage.removeItem('redirectAfterAuth');
      console.log('🔄 Redirecting to preserved path:', redirectPath);
      return <Navigate to={redirectPath} replace />;
    }
    // Only redirect to home from auth pages, not from other protected pages
    return <Navigate to="/" replace />;
  }
  
  // If user is not authenticated and on protected route, redirect to login
  if (!user && !isPublicRoute && !forceRender) {
    console.log('🚫 CentralizedAuthGuard: Unauthenticated user on protected route, redirecting to login');
    try {
      const fullPath = location.pathname + location.search + location.hash;
      sessionStorage.setItem('redirectAfterAuth', fullPath);
    } catch {}
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }
  
  // Render children for all other cases
  console.log('✅ CentralizedAuthGuard: Rendering children');
  return <>{children}</>;
};

export default CentralizedAuthGuard;