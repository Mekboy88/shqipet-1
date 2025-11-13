import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deviceSessionService } from '@/services/sessions/DeviceSessionService';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const SessionBootstrapper = () => {
  const { user } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);

  useEffect(() => {
    console.log('🔄 SessionBootstrapper: useEffect triggered, user:', user?.id || 'none');
    
    if (!user) {
      console.log('⚠️ SessionBootstrapper: No user, cleaning up');
      // Cleanup if user logs out
      sessionIdRef.current = null;
      if (heartbeatTimerRef.current) {
        window.clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      return;
    }

    let cancelled = false;

    const start = async () => {
      console.log('🚀 SessionBootstrapper: Starting device registration');
      console.log('🚀 User ID:', user.id);
      console.log('🚀 User Agent:', navigator.userAgent);
      console.log('🚀 Timestamp:', new Date().toISOString());
      
      try {
        // Register or update device immediately on login
        const id = await deviceSessionService.registerOrUpdateCurrentDevice(user.id);
        
        if (cancelled) {
          console.log('⚠️ SessionBootstrapper: Registration cancelled (component unmounted)');
          return;
        }
        
        sessionIdRef.current = id || null;

        if (id) {
          console.log('✅ SessionBootstrapper: Device registered successfully!');
          console.log('✅ Session ID:', id);
        } else {
          console.error('❌ SessionBootstrapper: Registration returned null - device NOT registered!');
        }
      } catch (error) {
        console.error('❌ SessionBootstrapper: Registration failed with error:', error);
      }

      // Heartbeat interval (60 seconds)
      if (heartbeatTimerRef.current) window.clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = window.setInterval(() => {
        if (sessionIdRef.current) {
          deviceSessionService.heartbeat(sessionIdRef.current);
        }
      }, 60000);

      // Update on focus/visibility (web)
      const onFocus = () => {
        if (sessionIdRef.current) deviceSessionService.heartbeat(sessionIdRef.current);
      };
      const onVisibility = () => {
        if (!document.hidden && sessionIdRef.current) {
          deviceSessionService.heartbeat(sessionIdRef.current);
        }
      };

      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibility);

      // Listen to Capacitor App lifecycle events (native)
      let appStateListener: any = null;
      let appResumeListener: any = null;
      
      if (Capacitor.isNativePlatform()) {
        console.log('📱 Setting up Capacitor App lifecycle listeners');
        
        // Listen to app state changes
        CapacitorApp.addListener('appStateChange', ({ isActive }) => {
          console.log(`📱 App state changed: ${isActive ? 'active' : 'background'}`);
          if (isActive && user?.id) {
            // Re-register device when app comes to foreground
            deviceSessionService.registerOrUpdateCurrentDevice(user.id).then(id => {
              sessionIdRef.current = id || null;
              console.log('✅ Device re-registered on app resume:', id);
            });
          }
        }).then(listener => {
          appStateListener = listener;
        });

        // Listen to app resume (iOS)
        CapacitorApp.addListener('resume', () => {
          console.log('📱 App resumed');
          if (sessionIdRef.current) {
            deviceSessionService.heartbeat(sessionIdRef.current);
          }
        }).then(listener => {
          appResumeListener = listener;
        });
      }

      // Cleanup listeners when user changes/unmounts
      return () => {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisibility);
        
        // Remove Capacitor listeners
        if (appStateListener) {
          appStateListener.remove();
        }
        if (appResumeListener) {
          appResumeListener.remove();
        }
      };
    };

    const cleanupListeners = start();

    return () => {
      cancelled = true;
      if (heartbeatTimerRef.current) {
        window.clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      if (cleanupListeners && typeof cleanupListeners.then === 'function') {
        cleanupListeners.then((cleanup) => {
          if (typeof cleanup === 'function') cleanup();
        });
      }
    };
  }, [user?.id]);

  return null;
};

export default SessionBootstrapper;
