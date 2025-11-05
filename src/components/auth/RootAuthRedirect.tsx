
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const RootAuthRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [forceShowLogin, setForceShowLogin] = React.useState(false);
  const location = useLocation();
  
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.warn('⚠️ RootAuthRedirect: Auth context not ready yet, redirecting to login');
    // If auth context fails, redirect to login instead of showing blank spinner
    return <Navigate to="/auth/login" replace />;
  }
  
  const { user, loading } = authContext;
  
  console.info('🔍 RootAuthRedirect - path:', location.pathname, 'user:', !!user, 'loading:', loading);
  
  // Public routes that don't need auth
  const publicRoutes = ['/auth/login', '/auth/register', '/register', '/auth/verification', '/auth/callback', '/terms-of-use', '/privacy-policy', '/create-post', '/compose', '/post/create', '/messages', '/landing'];
  const isPublicRoute = publicRoutes.includes(location.pathname);
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // CRITICAL: Timeout to prevent infinite loading (max 2 seconds)
  React.useEffect(() => {
    if (loading && !user && !isPublicRoute) {
      console.info('⏱️ RootAuthRedirect: Auth loading timeout started (2s)');
      const timeout = setTimeout(() => {
        console.warn('⚠️ RootAuthRedirect: Auth loading timeout exceeded, forcing login redirect');
        setForceShowLogin(true);
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [loading, user, isPublicRoute]);
  
  // Force redirect to login if timeout exceeded
  if (forceShowLogin && !user && !isPublicRoute) {
    console.info('🔄 RootAuthRedirect: Forcing redirect to login after timeout');
    return <Navigate to="/landing" replace />;
  }
  
  // Show loading while auth is initializing (but only briefly)
  if (loading) {
    console.info('🔄 RootAuthRedirect - Auth loading, showing spinner');
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }
  
  // Store current path for post-login redirect (only for protected routes)
  if (!user && !isPublicRoute) {
    const currentPath = location.pathname + location.search + location.hash;
    sessionStorage.setItem('redirectAfterAuth', currentPath);
    console.log('💾 Storing path for after login:', currentPath);
  }
  
  // If user is authenticated and on auth pages, check for redirect or go home
  if (user && location.pathname.startsWith('/auth/')) {
    const redirectPath = sessionStorage.getItem('redirectAfterAuth');
    if (redirectPath && redirectPath !== '/auth/login' && redirectPath !== '/auth/register') {
      sessionStorage.removeItem('redirectAfterAuth');
      console.log('🔄 RootAuthRedirect - Redirecting to stored path:', redirectPath);
      return <Navigate to={redirectPath} replace />;
    }
    console.log('🔄 RootAuthRedirect - Authenticated user on auth page, redirecting to home');
    return <Navigate to="/" replace />;
  }
  
  // CRITICAL: Preserve admin routes on refresh - don't redirect authenticated admin users
  if (user && isAdminRoute) {
    console.log('🔄 RootAuthRedirect - Admin user on admin route, preserving current path');
    return <>{children}</>;
  }
  
  // If not authenticated and on protected route, redirect to login
  if (!user && !isPublicRoute) {
    console.log('🚫 RootAuthRedirect - Unauthenticated user on protected route, redirecting to login');
    if (isAdminRoute) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/auth/login" replace />;
  }
  
  // Render children for all other cases - PRESERVE CURRENT URL
  console.log('✅ RootAuthRedirect - Rendering children for path:', location.pathname);
  return <>{children}</>;
};

export default RootAuthRedirect;
