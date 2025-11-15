import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { deviceDetectionService } from '@/services/deviceDetectionService';
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
        const deviceInfo = deviceDetectionService.getDeviceInfo();
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
              console.log('🚨 Session DELETE event received:', { 
                hasOld: !!payload.old, 
                deviceStableId: payload.old?.device_stable_id 
              });
              
              // Direct match: if we have the device_stable_id in old data
              if (payload.old?.device_stable_id === deviceStableId) {
                console.log('⚠️ Current device session was revoked (direct match)! Logging out...');
                
                toast.error('Your session was revoked from another device', {
                  description: 'You have been logged out for security reasons.',
                  duration: 5000,
                });

                await new Promise(resolve => setTimeout(resolve, 500));
                await signOut();
                return;
              }

              // Fallback: if old data is missing or incomplete, verify session exists
              console.log('🔍 Fallback check: querying if current device session still exists...');
              const { data, error } = await supabase
                .from('user_sessions')
                .select('id')
                .eq('user_id', user.id)
                .eq('device_stable_id', deviceStableId)
                .maybeSingle();

              if (!data) {
                // No row found - current device session was deleted
                console.log('⚠️ Current device session was revoked (fallback check)! Logging out...');
                
                toast.error('Your session was revoked from another device', {
                  description: 'You have been logged out for security reasons.',
                  duration: 5000,
                });

                await new Promise(resolve => setTimeout(resolve, 500));
                await signOut();
              } else if (error) {
                console.error('❌ Error checking session:', error);
              } else {
                console.log('✅ Current device session still exists, no logout needed');
              }
            }
          )
          .subscribe((status) => {
            console.log('📡 Session revocation monitor status:', status);
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
