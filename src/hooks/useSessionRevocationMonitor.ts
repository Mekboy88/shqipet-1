import { useEffect } from 'react';
import { perTabSupabase } from '@/integrations/supabase/perTabClient';
import { useAuth } from '@/contexts/AuthContext';
import { deviceDetectionService } from '@/services/deviceDetectionService';
import { toast } from 'sonner';

/**
 * Monitor for explicit session revocations only (via session_revocations table)
 * Does NOT auto-logout on user_sessions DELETE or heartbeat failures
 */
export const useSessionRevocationMonitor = () => {
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) return;

    let deviceStableId: string | null = null;
    let channel: ReturnType<typeof perTabSupabase.channel> | null = null;

    const setupMonitoring = async () => {
      try {
        // Get current device ID
        deviceStableId = await deviceDetectionService.getCurrentDeviceStableId();

        console.log('🔒 Session revocation monitor (per-tab): Watching device', deviceStableId);
        console.log('👤 User ID:', user.id);

        // Subscribe ONLY to explicit revocation signals (session_revocations INSERT)
        // Do NOT listen to user_sessions DELETE to avoid cross-tab logout issues
        channel = perTabSupabase
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
              console.log('🚨 Explicit revocation signal received:', payload.new);
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
          .subscribe();

        console.log('✅ Session revocation monitor: Subscribed successfully');
        
        // Heartbeat disabled - only explicit revocation signals trigger logout
        // This prevents false positives from DB row changes during normal operations

      } catch (error) {
        console.error('Failed to setup session revocation monitor:', error);
      }
    };

    setupMonitoring();

    // Cleanup
    return () => {
      if (channel) {
        console.log('🔓 Session revocation monitor: Cleaning up');
        channel.unsubscribe();
      }
    };
  }, [user, signOut]);
};
