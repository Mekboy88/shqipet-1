import { useEffect, useRef } from 'react';
import { perTabSupabase } from '@/integrations/supabase/perTabClient';
import { useAuth } from '@/contexts/AuthContext';
import { deviceDetectionService } from '@/services/deviceDetectionService';
import { toast } from 'sonner';

/**
 * Monitor for explicit session revocations only (via session_revocations table)
 * Does NOT auto-logout on user_sessions DELETE or heartbeat failures
 * 
 * FIXED: Proper async handling, refs, lowercase normalization, subscription status checking
 */
export const useSessionRevocationMonitor = () => {
  const { user, signOut } = useAuth();
  const deviceStableIdRef = useRef<string | null>(null);
  const channelRef = useRef<ReturnType<typeof perTabSupabase.channel> | null>(null);
  const isSettingUpRef = useRef(false);

  useEffect(() => {
    if (!user || isSettingUpRef.current) return;

    isSettingUpRef.current = true;

    const setupMonitoring = async () => {
      try {
        // Get current device ID (wait for it to complete)
        const deviceStableId = await deviceDetectionService.getCurrentDeviceStableId();
        deviceStableIdRef.current = deviceStableId.toLowerCase(); // Normalize to lowercase

        console.log('🔒 Session revocation monitor (per-tab): Setting up for device:', deviceStableIdRef.current);
        console.log('👤 User ID:', user.id);

        // Create unique channel name to avoid conflicts
        const channelName = `session-revocation-${deviceStableId}-${Date.now()}`;
        const channel = perTabSupabase.channel(channelName);

        // Subscribe ONLY to explicit revocation signals (session_revocations INSERT)
        channel
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
              
              const revokedDeviceId = (payload.new?.device_stable_id || '').toLowerCase();
              const currentDeviceId = deviceStableIdRef.current?.toLowerCase();
              
              console.log('🔍 Comparing revoked device with current:');
              console.log('   Revoked:', revokedDeviceId);
              console.log('   Current:', currentDeviceId);
              console.log('   Match:', revokedDeviceId === currentDeviceId);
              
              // Check if this revocation is for the current device (case-insensitive)
              if (revokedDeviceId === currentDeviceId) {
                console.log('⚠️ INSTANT REVOCATION: Current device session revoked! Logging out...');
                
                toast.error('Your session was revoked from another device', {
                  description: 'You have been logged out for security reasons.',
                  duration: 5000,
                });

                // Give toast time to show
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Perform logout
                await signOut();
              } else {
                console.log('✅ Revocation signal for different device, ignoring');
              }
            }
          )
          .subscribe((status, err) => {
            if (err) {
              console.error('❌ Session revocation monitor subscription error:', err);
              isSettingUpRef.current = false;
              return;
            }
            
            console.log('📡 Session revocation monitor status:', status);
            
            if (status === 'SUBSCRIBED') {
              console.log('✅ Session revocation monitor: ACTIVE and listening');
              channelRef.current = channel;
              isSettingUpRef.current = false;
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Session revocation monitor: CHANNEL ERROR');
              isSettingUpRef.current = false;
            } else if (status === 'TIMED_OUT') {
              console.error('⏱️ Session revocation monitor: TIMED OUT - retrying...');
              isSettingUpRef.current = false;
              // Could add retry logic here if needed
            } else if (status === 'CLOSED') {
              console.log('🔌 Session revocation monitor: CLOSED');
              isSettingUpRef.current = false;
            }
          });

      } catch (error) {
        console.error('❌ Failed to setup session revocation monitor:', error);
        isSettingUpRef.current = false;
      }
    };

    setupMonitoring();

    // Cleanup
    return () => {
      if (channelRef.current) {
        console.log('🔓 Session revocation monitor: Cleaning up');
        perTabSupabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      deviceStableIdRef.current = null;
      isSettingUpRef.current = false;
    };
  }, [user, signOut]);
};
