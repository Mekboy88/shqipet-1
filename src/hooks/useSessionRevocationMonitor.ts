import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { deviceDetectionService } from '@/services/device/DeviceDetectionService';
import { toast } from 'sonner';

/**
 * Monitor for session revocations and auto-logout if current device session is revoked
 */
export const useSessionRevocationMonitor = () => {
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) return;

    let deviceStableId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupMonitoring = async () => {
      try {
        // Get current device ID
        const deviceInfo = await deviceDetectionService.getDeviceInfo();
        deviceStableId = deviceInfo.deviceStableId;

        console.log('🔒 Session revocation monitor: Watching device', deviceStableId);

        // Subscribe to session deletions
        channel = supabase
          .channel('session-revocation-monitor')
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'user_sessions',
              filter: `user_id=eq.${user.id}`,
            },
            async (payload) => {
              console.log('🚨 Session deleted:', payload);
              
              // Check if the deleted session is for the current device
              if (payload.old?.device_stable_id === deviceStableId) {
                console.log('⚠️ Current device session was revoked! Logging out...');
                
                toast.error('Your session was revoked from another device', {
                  description: 'You have been logged out for security reasons.',
                  duration: 5000,
                });

                // Wait a brief moment for the toast to show
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Force logout
                await signOut();
              }
            }
          )
          .subscribe((status) => {
            console.log('Session revocation monitor status:', status);
          });
      } catch (error) {
        console.error('Failed to setup session revocation monitor:', error);
      }
    };

    setupMonitoring();

    // Cleanup
    return () => {
      if (channel) {
        console.log('🔓 Session revocation monitor: Cleaning up');
        supabase.removeChannel(channel);
      }
    };
  }, [user, signOut]);
};
