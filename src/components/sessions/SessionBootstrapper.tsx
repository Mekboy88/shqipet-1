import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deviceSessionService } from '@/services/sessions/DeviceSessionService';

const SessionBootstrapper = () => {
  const { user } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) {
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
      console.log('🚀 SessionBootstrapper: Registering device globally for user:', user.id);
      
      // Register or update device immediately on login
      const id = await deviceSessionService.registerOrUpdateCurrentDevice(user.id);
      if (cancelled) return;
      sessionIdRef.current = id || null;

      if (id) {
        console.log('✅ SessionBootstrapper: Device registered globally with session ID:', id);
      }

      // Heartbeat interval (60 seconds)
      if (heartbeatTimerRef.current) window.clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = window.setInterval(() => {
        if (sessionIdRef.current) {
          deviceSessionService.heartbeat(sessionIdRef.current);
        }
      }, 60000);

      // Update on focus/visibility
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

      // Cleanup listeners when user changes/unmounts
      return () => {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisibility);
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
