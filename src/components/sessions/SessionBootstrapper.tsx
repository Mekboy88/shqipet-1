import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deviceSessionService } from '@/services/sessions/DeviceSessionService';
import { supabase } from '@/integrations/supabase/client';
import { immediateLogoutService } from '@/utils/auth/immediateLogoutService';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const SessionBootstrapper = () => {
  const { user } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const currentStableIdRef = useRef<string | null>(null);

  // Self-check to ensure logout if is_active is false
  const checkSessionActive = useCallback(async () => {
    if (!user?.id || !currentStableIdRef.current) return;

    try {
      const { data: session, error } = await supabase
        .from('user_sessions')
        .select('is_active, session_status')
        .eq('user_id', user.id)
        .eq('device_stable_id', currentStableIdRef.current)
        .maybeSingle();

      if (!error && session && session.is_active === false) {
        console.log('🚪 Self-check: Current device marked inactive - forcing logout');
        await immediateLogoutService.performImmediateLogout();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('❌ Self-check failed:', error);
    }
  }, [user?.id]);

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
        // Get stable ID
        const stableId = await deviceSessionService.getStableDeviceId();
        currentStableIdRef.current = stableId;
        console.log('🔑 SessionBootstrapper: Current stable ID:', stableId);
        
        // Register or update device immediately on login
        const id = await deviceSessionService.registerOrUpdateCurrentDevice(user.id, { forceReclassify: true });
        
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
        
        // Initial self-check
        await checkSessionActive();
      } catch (error) {
        console.error('❌ SessionBootstrapper: Registration failed with error:', error);
      }

      // Heartbeat interval (60 seconds) with self-check
      if (heartbeatTimerRef.current) window.clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = window.setInterval(async () => {
        if (sessionIdRef.current) {
          deviceSessionService.heartbeat(sessionIdRef.current);
        }
        // Self-check on every heartbeat
        await checkSessionActive();
      }, 60000);

      // Update on focus/visibility (web) with self-check AND re-registration
      const onFocus = async () => {
        console.log('🔄 Window focused - re-registering device and checking session');
        if (sessionIdRef.current) deviceSessionService.heartbeat(sessionIdRef.current);
        // Re-register to ensure device is always up-to-date
        try {
          await deviceSessionService.registerOrUpdateCurrentDevice(user.id, { forceReclassify: true });
          console.log('✅ Device re-registered on focus');
        } catch (e) {
          console.error('❌ Failed to re-register on focus:', e);
        }
        await checkSessionActive();
      };
      const onVisibility = async () => {
        console.log('🔄 Visibility changed - re-registering device and checking session');
        if (!document.hidden) {
          if (sessionIdRef.current) {
            deviceSessionService.heartbeat(sessionIdRef.current);
          }
          // Re-register to ensure device is always up-to-date
          try {
            await deviceSessionService.registerOrUpdateCurrentDevice(user.id, { forceReclassify: true });
            console.log('✅ Device re-registered on visibility change');
          } catch (e) {
            console.error('❌ Failed to re-register on visibility change:', e);
          }
          await checkSessionActive();
        }
      };

      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibility);

      // Realtime instant logout enforcement
      if (currentStableIdRef.current) {
        const logoutChannel = supabase
          .channel(`instant-logout-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'user_sessions',
              filter: `user_id=eq.${user.id}`
            },
            async (payload: any) => {
              const updatedSession = payload.new;
              // CRITICAL: Use ONLY stable ID (no fallback)
              const sessionStableId = updatedSession.device_stable_id;
              
              if (!sessionStableId) {
                console.warn('⚠️ Realtime update missing stable ID, ignoring');
                return;
              }
              
              // If this update is for the current device and it's marked inactive
              if (sessionStableId === currentStableIdRef.current && updatedSession.is_active === false) {
                console.log('🚪 Realtime: Current device marked inactive - forcing immediate logout');
                await immediateLogoutService.performImmediateLogout();
                window.location.href = '/login';
              }
            }
          )
          .subscribe();

        // Store for cleanup
        (window as any).__logoutChannel = logoutChannel;
      }

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
        
        // Remove realtime channel
        const logoutChannel = (window as any).__logoutChannel;
        if (logoutChannel) {
          supabase.removeChannel(logoutChannel);
          delete (window as any).__logoutChannel;
        }
        
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
  }, [user?.id, checkSessionActive]);

  return null;
};

export default SessionBootstrapper;
