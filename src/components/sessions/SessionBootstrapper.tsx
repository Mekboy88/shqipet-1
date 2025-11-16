import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { deviceDetectionService } from '@/services/deviceDetectionService';
import { toast } from 'sonner';
import { immediateLogoutService } from '@/utils/auth/immediateLogoutService';

const SessionBootstrapper = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    console.log('📍 SessionBootstrapper: Registering user session', user.id);

    const TAB_FLAG = '__tab_session_registered_v1';
    let registered = sessionStorage.getItem(TAB_FLAG) === '1';
    let decremented = false;

    // Simple cross-tab probe using BroadcastChannel
    const channel = new BroadcastChannel('lovable_session_tabs');
    let gotPong = false;

    channel.onmessage = (event) => {
      const data = event.data;
      if (data?.type === 'ping') {
        channel.postMessage({ type: 'pong' });
      } else if (data?.type === 'pong') {
        gotPong = true;
      }
    };

    const registerSession = async () => {
      if (registered) {
        console.log('ℹ️ Session already registered for this tab — skipping');
        return;
      }
      try {
        // Probe for other open tabs
        gotPong = false;
        channel.postMessage({ type: 'ping' });
        await new Promise((r) => setTimeout(r, 200));
        const hasPeers = gotPong;

        const deviceInfo = deviceDetectionService.getDeviceInfo();
        const location = await deviceDetectionService.getBrowserLocation().catch(() => null);

        const sessionData = {
          ...deviceInfo,
          latitude: location?.latitude,
          longitude: location?.longitude,
          resetTabs: !hasPeers, // if no peers responded, re-baseline to 1
        } as const;

        console.log('📍 Registering session with device info:', deviceInfo.deviceStableId, 'resetTabs:', sessionData.resetTabs);

        const { error: invokeError } = await supabase.functions.invoke('manage-session', {
          body: {
            action: 'upsert',
            sessionData,
          },
        });

        if (invokeError) {
          const status = (invokeError as any)?.context?.status || (invokeError as any)?.status;
          const body = (invokeError as any)?.context?.body || (invokeError as any)?.body;
          const code = body?.error || body?.code || (invokeError as any)?.code;
          const message = body?.message || (invokeError as any)?.message || '';
          const isRevoked = code === 'DEVICE_REVOKED' || String(message).includes('DEVICE_REVOKED') || status === 403;

          if (isRevoked) {
            console.log('🚫 DEVICE_REVOKED detected during registration - signing out immediately');
            toast.error('This device was revoked', {
              description: 'You have been signed out for security reasons.',
              duration: 5000,
            });
            await immediateLogoutService.performImmediateLogout(false);
            return;
          }

          throw invokeError;
        }

        registered = true;
        sessionStorage.setItem(TAB_FLAG, '1');
        console.log('✅ Session registered successfully');
      } catch (err: any) {
        console.error('Failed to register session:', err);
        toast.error('Failed to register device session', { description: err.message });
      }
    };

    const decrementTabCount = async () => {
      if (!registered || decremented) return;
      decremented = true;
      try {
        const deviceStableId = deviceDetectionService.getCurrentDeviceStableId();
        console.log('📍 Tab closing/hidden, decrementing count for:', deviceStableId);

        await supabase.functions.invoke('manage-session', {
          body: {
            action: 'tab_close',
            deviceStableId,
          },
        });
      } catch (err) {
        console.error('Failed to decrement tab count (best effort):', err);
      } finally {
        sessionStorage.removeItem(TAB_FLAG);
      }
    };

    // Register on mount (guarded)
    registerSession();

    // Decrement reliably on close/hidden
    window.addEventListener('beforeunload', decrementTabCount);
    window.addEventListener('pagehide', decrementTabCount);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') decrementTabCount();
    });

    return () => {
      window.removeEventListener('beforeunload', decrementTabCount);
      window.removeEventListener('pagehide', decrementTabCount);
    };
  }, [user]);

  return null;
};

export default SessionBootstrapper;
