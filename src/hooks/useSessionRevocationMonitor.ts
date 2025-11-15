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
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const setupMonitoring = async () => {
      try {
        // Get current device ID
        deviceStableId = deviceDetectionService.getCurrentDeviceStableId();

        console.log('🔒 Session revocation monitor: Watching device', deviceStableId);
        console.log('👤 User ID:', user.id);

        // Subscribe to revocation signals AND session deletions
        channel = supabase
          .channel('session-revocation-monitor')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'session_revocations',
              filter: `user_id=eq.${user.id}`,
            },
            async (payload) => {
              console.log('🚨 Revocation signal received:', payload.new);
              console.log('🔍 Comparing:', payload.new?.device_stable_id, '===', deviceStableId);
              
              // Check if this revocation is for the current device
              if (payload.new?.device_stable_id === deviceStableId) {
                console.log('⚠️ INSTANT REVOCATION: Current device session revoked! Logging out...');
                
                toast.error('Your session was revoked from another device', {
                  description: 'You have been logged out for security reasons.',
                  duration: 5000,
                });

                await new Promise(resolve => setTimeout(resolve, 300));
                await signOut();
              } else {
                console.log('✅ Revocation signal for different device, ignoring');
              }
            }
          )
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
                console.log('⚠️ Current device session was deleted (direct match)! Logging out...');
                
                toast.error('Your session was revoked from another device', {
                  description: 'You have been logged out for security reasons.',
                  duration: 5000,
                });

                await new Promise(resolve => setTimeout(resolve, 300));
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
                console.log('⚠️ Current device session was deleted (fallback check)! Logging out...');
                
                toast.error('Your session was revoked from another device', {
                  description: 'You have been logged out for security reasons.',
                  duration: 5000,
                });

                await new Promise(resolve => setTimeout(resolve, 300));
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
            if (status === 'SUBSCRIBED') {
              console.log('✅ Successfully subscribed to session revocation events');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.error('❌ Subscription error:', status);
            }
          });

        // Heartbeat: every 1 second, verify session still exists (hardened fallback)
        heartbeatInterval = setInterval(async () => {
          if (!deviceStableId) return;

          const { data, error } = await supabase
            .from('user_sessions')
            .select('id')
            .eq('user_id', user.id)
            .eq('device_stable_id', deviceStableId)
            .maybeSingle();

          // Immediate logout if session missing OR error querying
          if (!data || error) {
            console.log('💔 Heartbeat detected missing session or error! Logging out...');
            if (error) console.error('Heartbeat error:', error);
            
            toast.error('Your session was revoked', {
              description: 'You have been logged out for security reasons.',
              duration: 5000,
            });

            await signOut();
          }
        }, 1000);

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
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [user, signOut]);
};
