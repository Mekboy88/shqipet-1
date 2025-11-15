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

    let registered = false;

    const registerSession = async () => {
      try {
        const deviceInfo = deviceDetectionService.getDeviceInfo();
        const location = await deviceDetectionService.getBrowserLocation().catch(() => null);

        const sessionData = {
          ...deviceInfo,
          latitude: location?.latitude,
          longitude: location?.longitude,
        };

        console.log('📍 Registering session with device info:', deviceInfo.deviceStableId);

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
          const message = body?.message || invokeError?.message || '';
          const isRevoked = code === 'DEVICE_REVOKED' || message.includes('DEVICE_REVOKED') || status === 403;

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
        console.log('✅ Session registered successfully');
      } catch (err: any) {
        console.error('Failed to register session:', err);
        toast.error('Failed to register device session', {
          description: err.message,
        });
      }
    };

    const decrementTabCount = async () => {
      if (!registered) return;

      try {
        const deviceStableId = deviceDetectionService.getCurrentDeviceStableId();
        console.log('📍 Tab closing, decrementing count for:', deviceStableId);

        await supabase.functions.invoke('manage-session', {
          body: {
            action: 'tab_close',
            deviceStableId,
          },
        });
      } catch (err) {
        console.error('Failed to decrement tab count (best effort):', err);
      }
    };

    // Register on mount
    registerSession();

    // Decrement on tab close/unload
    window.addEventListener('beforeunload', decrementTabCount);
    window.addEventListener('pagehide', decrementTabCount);

    return () => {
      window.removeEventListener('beforeunload', decrementTabCount);
      window.removeEventListener('pagehide', decrementTabCount);
    };
  }, [user]);

  return null;
};

export default SessionBootstrapper;
