import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { deviceDetectionService } from '@/services/deviceDetectionService';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type UserSession = Database['public']['Tables']['user_sessions']['Row'];

export const useSessionManagement = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [hasRegistered, setHasRegistered] = useState(false);

  useEffect(() => {
    if (!user) return;

    const registerSession = async () => {
      try {
        // Ensure we have a valid session before calling the edge function
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('No active session found');
          return;
        }

        const deviceInfo = deviceDetectionService.getDeviceInfo();
        const location = await deviceDetectionService.getBrowserLocation();

        const { data, error } = await supabase.functions.invoke('manage-session', {
          body: {
            action: 'upsert',
            sessionData: {
              ...deviceInfo,
              latitude: location?.latitude,
              longitude: location?.longitude,
            },
          },
        });

        if (error) throw error;
        setCurrentDeviceId(deviceInfo.deviceStableId);
        setHasRegistered(true);
      } catch (err: any) {
        console.error('Failed to register session:', err);
        toast.error('Failed to register device session');
        setHasRegistered(true);
      }
    };

    registerSession();
  }, [user]);

  const refreshSessions = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Verify session is active
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No active session');
        return;
      }

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (err: any) {
      console.error('Failed to fetch sessions:', err);
      setError(err.message);
      toast.error('Failed to load device sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasRegistered) {
      refreshSessions();
    }

    const channel = supabase
      .channel('user_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'user_sessions',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          const deletedSession = payload.old as UserSession;
          if (deletedSession.device_stable_id === currentDeviceId) {
            toast.error('Your session was revoked. Logging out...', {
              duration: 1000,
            });
            // Instant logout - no delay
            supabase.auth.signOut();
          } else {
            // Update sessions list when another device is logged out
            refreshSessions();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_sessions',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          // Refresh sessions when any session is updated (e.g., trust status)
          refreshSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentDeviceId, hasRegistered]);

  const trustDevice = async (deviceStableId: string) => {
    // Find the session to determine new state
    const targetSession = sessions.find(s => s.device_stable_id === deviceStableId);
    if (!targetSession) return;
    
    const newTrustState = !targetSession.is_trusted;
    
    // Optimistically update the UI immediately
    const previousSessions = [...sessions];
    setSessions(prevSessions =>
      prevSessions.map(session =>
        session.device_stable_id === deviceStableId
          ? { ...session, is_trusted: newTrustState }
          : session
      )
    );

    try {
      const { error } = await supabase.functions.invoke('manage-session', {
        body: { action: 'trust', deviceStableId },
      });

      if (error) throw error;
      
      toast.success(newTrustState ? 'Device marked as trusted' : 'Device trust removed');
      
      // Refresh to sync with server (happens in background)
      refreshSessions();
    } catch (err: any) {
      // Revert optimistic update on error
      setSessions(previousSessions);
      console.error('Failed to trust device:', err);
      toast.error('Failed to update device trust status');
    }
  };

  const revokeSession = async (deviceStableId: string) => {
    // Prevent revoking the session of the current device from itself
    if (deviceStableId === currentDeviceId) {
      toast.error('Cannot revoke the current device. Please use Sign out on this device.');
      return;
    }

    // Optimistically remove session from UI immediately for other devices
    const previousSessions = [...sessions];
    setSessions(prevSessions =>
      prevSessions.filter(session => session.device_stable_id !== deviceStableId)
    );

    try {
      const { error } = await supabase.functions.invoke('manage-session', {
        body: { action: 'revoke', deviceStableId },
      });

      if (error) throw error;
      toast.success('Device logged out');
      
      // Refresh to sync with server (happens in background)
      refreshSessions();
    } catch (err: any) {
      // Revert optimistic update on error
      setSessions(previousSessions);
      console.error('Failed to revoke session:', err);
      toast.error('Failed to revoke device session');
    }
  };

  return {
    sessions,
    loading,
    error,
    currentDeviceId,
    refreshSessions,
    trustDevice,
    revokeSession,
  };
};
