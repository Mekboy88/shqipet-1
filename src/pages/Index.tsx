

import React from 'react';

import { useAuth } from '@/contexts/AuthContext';
import Feed from '@/components/Feed';
import Login from '@/pages/auth/Login';

const Index = () => {
  // Safe auth access with error handling
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.warn('Index: Auth context not ready yet');
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }
  
  const { user, loading } = authContext;
  console.log('🏠 Index page - user:', !!user, 'loading:', loading);
  
  // Show loading while checking auth
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }
  
  // If no user, show login at root URL
  if (!user) {
    return <Login />;
  }
  
  return (
    <div className="min-h-screen bg-background w-full">
      <div className="w-full max-w-none mx-auto">
        <Feed />
      </div>
    </div>
  );
};

export default Index;
