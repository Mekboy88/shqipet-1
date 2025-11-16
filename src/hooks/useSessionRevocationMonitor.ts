import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSettingUpRef = useRef(false);

  useEffect(() => {
    if (!user || isSettingUpRef.current) return;

    isSettingUpRef.current = true;

    const setupMonitoring = async () => {
      try {
        // Get current device ID (wait for it to complete)
        const deviceStableId = await deviceDetectionService.getCurrentDeviceStableId();
        deviceStableIdRef.current = deviceStableId.toLowerCase(); // Normalize to lowercase

        console.log('🔒 Session revocation monitor (unified): Setting up for device:', deviceStableIdRef.current);
        console.log('👤 User ID:', user.id);

        // Create unique channel name to avoid conflicts
        const channelName = `session-revocation-${deviceStableId}-${Date.now()}`;
        const channel = supabase.channel(channelName);

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
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('🚨 REVOCATION SIGNAL RECEIVED (INSERT event)');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('Payload:', JSON.stringify(payload, null, 2));
              
              const rawRevokedId = payload.new?.device_stable_id;
              const rawCurrentId = deviceStableIdRef.current;
              
              console.log('📋 Raw IDs (before normalization):');
              console.log('  Revoked (from DB):', rawRevokedId);
              console.log('  Current (from ref):', rawCurrentId);
              
              const revokedDeviceId = (rawRevokedId || '').toLowerCase().trim();
              const currentDeviceId = (rawCurrentId || '').toLowerCase().trim();
              
              console.log('📋 Normalized IDs (lowercase + trimmed):');
              console.log('  Revoked:', revokedDeviceId);
              console.log('  Current:', currentDeviceId);
              console.log('  Length:', `revoked=${revokedDeviceId.length}, current=${currentDeviceId.length}`);
              console.log('  Match:', revokedDeviceId === currentDeviceId);
              console.log('  Byte comparison:', revokedDeviceId.split('').map((c, i) => 
                `${i}: ${c.charCodeAt(0)} ${c === currentDeviceId[i] ? '✓' : '✗'}`
              ));
              
              if (revokedDeviceId === currentDeviceId) {
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('⚠️ MATCH CONFIRMED - LOGGING OUT THIS DEVICE');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                
                toast.error('Your session was revoked from another device', {
                  description: 'You have been logged out for security reasons.',
                  duration: 5000,
                });

                await new Promise(resolve => setTimeout(resolve, 500));
                
                console.log('🚪 Calling signOut()...');
                await signOut();
                console.log('✅ signOut() completed');
              } else {
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('✅ NO MATCH - This revocation is for a different device');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              }
            }
          )
          .subscribe((status, err) => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📡 Session Revocation Monitor Status:', status);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            if (err) {
              console.error('❌ Subscription error:', err);
              isSettingUpRef.current = false;
              return;
            }
            
            if (status === 'SUBSCRIBED') {
              console.log('✅ MONITOR ACTIVE - Listening for revocations');
              console.log('   User ID:', user.id);
              console.log('   Device ID:', deviceStableIdRef.current);
              console.log('   Channel:', channelName);
              channelRef.current = channel;
              isSettingUpRef.current = false;
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ CHANNEL ERROR - Monitor failed to subscribe');
              isSettingUpRef.current = false;
            } else if (status === 'TIMED_OUT') {
              console.warn('⏱️ SUBSCRIPTION TIMED OUT - Retrying in 2 seconds...');
              setTimeout(() => {
                if (user && !channelRef.current) {
                  console.log('🔄 Retrying subscription...');
                  isSettingUpRef.current = false;
                  setupMonitoring(); // Retry once
                }
              }, 2000);
            } else if (status === 'CLOSED') {
              console.log('🔒 Channel closed');
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
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      deviceStableIdRef.current = null;
      isSettingUpRef.current = false;
    };
  }, [user, signOut]);
};
