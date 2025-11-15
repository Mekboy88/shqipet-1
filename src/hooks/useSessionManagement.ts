import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { deviceDetectionService } from '@/services/device/DeviceDetectionService';
import { geolocationService } from '@/services/geolocation/GeolocationService';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type UserSession = Database['public']['Tables']['user_sessions']['Row'];

interface SessionManagementState {
  sessions: UserSession[];
  loading: boolean;
  error: string | null;
  currentDeviceId: string | null;
}

export const useSessionManagement = () => {
  const [state, setState] = useState<SessionManagementState>({
    sessions: [],
    loading: true,
    error: null,
    currentDeviceId: null,
  });
  const { toast } = useToast();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Register or update current device session
   */
  const registerCurrentDevice = useCallback(async () => {
    try {
      console.log('Registering current device...');

      // Ensure user is authenticated before proceeding
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        console.log('No active session, skipping device registration');
        return null;
      }

      // Get device info
      const deviceInfo = await deviceDetectionService.getDeviceInfo();
      console.log('Device info obtained:', deviceInfo);

      // Try to get geolocation (non-blocking)
      const geolocation = await geolocationService.requestLocation();
      console.log('Geolocation:', geolocation);

      // Call edge function to register/update session
      const { data, error } = await supabase.functions.invoke('manage-session', {
        body: {
          action: 'register',
          sessionData: {
            ...deviceInfo,
            latitude: geolocation?.latitude,
            longitude: geolocation?.longitude,
            sessionToken: authSession.access_token,
            mfaEnabled: false, // TODO: Get from user settings
          },
        },
      });

      if (error) {
        console.error('Failed to register device:', error);
        throw error;
      }

      console.log('Device registered successfully:', data);

      setState((prev) => ({ ...prev, currentDeviceId: deviceInfo.deviceStableId }));

      // Note: We don't update activity periodically to preserve the original login time display
      // Activity is only updated on login, not during navigation

      return data.session;
    } catch (error) {
      console.error('Device registration error:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to register device',
      }));
      return null;
    }
  }, []);

  /**
   * Update last activity timestamp
   */
  const updateActivity = useCallback(async (deviceStableId: string) => {
    try {
      await supabase.functions.invoke('manage-session', {
        body: {
          action: 'update_activity',
          sessionData: { deviceStableId },
        },
      });
      console.log('Activity updated for device:', deviceStableId);
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  }, []);

  /**
   * Fetch all sessions for current user
   */
  const fetchSessions = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // 5C: Auto-revoke expired sessions before fetching
      try {
        await supabase.rpc('revoke_expired_sessions');
      } catch (revokeError) {
        console.warn('Failed to auto-revoke expired sessions:', revokeError);
      }

      // 5B: Fetch only real data from database (no demo/fake data)
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_activity', { ascending: false });

      if (error) throw error;

      // 5B: Only show real sessions - empty array if none exist
      setState((prev) => ({
        ...prev,
        sessions: data || [],
        loading: false,
      }));

      console.log('Fetched real sessions:', data?.length || 0);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch sessions',
        loading: false,
      }));
    }
  }, []);

  /**
   * Revoke a device session
   */
  const revokeSession = useCallback(async (deviceStableId: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-session', {
        body: {
          action: 'revoke',
          sessionData: { deviceStableId },
        },
      });

      if (error) throw error;

      toast({
        title: 'Session revoked',
        description: 'Device has been logged out successfully',
      });

      // Refresh sessions list
      await fetchSessions();
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke session',
        variant: 'destructive',
      });
    }
  }, [fetchSessions, toast]);

  /**
   * Trust a device
   */
  const trustDevice = useCallback(async (deviceStableId: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-session', {
        body: {
          action: 'trust',
          sessionData: { deviceStableId },
        },
      });

      if (error) throw error;

      toast({
        title: 'Device trusted',
        description: 'This device is now marked as trusted',
      });

      // Refresh sessions list
      await fetchSessions();
    } catch (error) {
      console.error('Failed to trust device:', error);
      toast({
        title: 'Error',
        description: 'Failed to trust device',
        variant: 'destructive',
      });
    }
  }, [fetchSessions, toast]);

  /**
   * Set up real-time subscription
   */
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Setting up real-time subscription for sessions...');

      // Clean up existing channel
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      // Create new channel
      const channel = supabase
        .channel('user_sessions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_sessions',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Real-time session change:', payload);

            setState((prev) => {
              let updatedSessions = [...prev.sessions];

              if (payload.eventType === 'INSERT') {
                updatedSessions.unshift(payload.new as UserSession);
              } else if (payload.eventType === 'UPDATE') {
                const index = updatedSessions.findIndex((s) => s.id === payload.new.id);
                if (index !== -1) {
                  updatedSessions[index] = payload.new as UserSession;
                }
              } else if (payload.eventType === 'DELETE') {
                updatedSessions = updatedSessions.filter((s) => s.id !== payload.old.id);
              }

              return {
                ...prev,
                sessions: updatedSessions,
              };
            });
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
        activityIntervalRef.current = null;
      }
    };
  }, []);

  /**
   * Normalize existing sessions (fix device names and locations)
   */
  const normalizeSessions = useCallback(async () => {
    try {
      console.log('Normalizing sessions...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('manage-session', {
        body: { 
          action: 'normalize'
        }
      });

      if (response.error) throw response.error;

      console.log('Sessions normalized:', response.data);
      toast({
        title: 'Sessions normalized',
        description: `Fixed ${response.data?.normalized || 0} session(s)`,
      });

      // Refresh sessions to show updated data
      await fetchSessions();
    } catch (error) {
      console.error('Failed to normalize sessions:', error);
      toast({
        title: 'Normalization failed',
        description: error instanceof Error ? error.message : 'Failed to normalize sessions',
        variant: 'destructive',
      });
    }
  }, [toast, fetchSessions]);

  /**
   * Initialize: register device and fetch sessions
   */
  useEffect(() => {
    const initialize = async () => {
      // Check if user is authenticated first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('User not authenticated, skipping session management');
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      // 5C: Auto-revoke expired sessions on initialization
      try {
        await supabase.rpc('revoke_expired_sessions');
        console.log('Expired sessions revoked on initialization');
      } catch (error) {
        console.warn('Failed to auto-revoke expired sessions:', error);
      }

      await registerCurrentDevice();
      await fetchSessions();
    };

    initialize();
  }, [registerCurrentDevice, fetchSessions]);

  return {
    sessions: state.sessions,
    loading: state.loading,
    error: state.error,
    currentDeviceId: state.currentDeviceId,
    registerCurrentDevice,
    revokeSession,
    trustDevice,
    refreshSessions: fetchSessions,
    normalizeSessions,
  };
};
