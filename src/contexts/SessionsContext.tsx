import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type UserSession = Database['public']['Tables']['user_sessions']['Row'];

interface SessionsContextValue {
  sessions: UserSession[];
  loading: boolean;
  error: string | null;
  currentDeviceId: string | null;
  refreshSessions: () => Promise<void>;
  trustDevice: (deviceStableId: string) => Promise<void>;
  revokeSession: (deviceStableId: string) => Promise<void>;
  revokeAllOtherDevices: () => Promise<void>;
}

const SessionsContext = createContext<SessionsContextValue | undefined>(undefined);

export const SessionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);

  // Deduplicate sessions by device_stable_id (keep most recent)
  // CRITICAL: Ensures only ONE card per physical device
  const deduplicateSessions = (sessionsArray: UserSession[]): UserSession[] => {
    const map = new Map<string, UserSession>();
    let duplicatesFound = 0;
    
    for (const session of sessionsArray) {
      const existing = map.get(session.device_stable_id);
      if (!existing) {
        map.set(session.device_stable_id, session);
      } else {
        duplicatesFound++;
        // Keep most recent by created_at, then by updated_at
        const existingCreated = new Date(existing.created_at).getTime();
        const sessionCreated = new Date(session.created_at).getTime();
        const existingUpdated = new Date(existing.updated_at).getTime();
        const sessionUpdated = new Date(session.updated_at).getTime();
        
        if (sessionCreated > existingCreated || 
           (sessionCreated === existingCreated && sessionUpdated > existingUpdated)) {
          map.set(session.device_stable_id, session);
        }
      }
    }
    
    // Warn if duplicates were found (shouldn't happen with UNIQUE constraint)
    if (duplicatesFound > 0) {
      console.warn(`⚠️ Found ${duplicatesFound} duplicate device_stable_id entries (fixed by deduplication)`);
    }
    
    // Validate device count
    const uniqueDevices = map.size;
    const totalSessions = sessionsArray.length;
    if (totalSessions !== uniqueDevices) {
      console.log(`📊 Deduplicated ${totalSessions} sessions → ${uniqueDevices} unique devices`);
    }
    
    return Array.from(map.values());
  };

  // Fetch all sessions for the user
  const refreshSessions = async () => {
    if (!user) {
      setSessions([]);
      setCurrentDeviceId(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current device ID from local storage (instant detection)
      const localDeviceId = localStorage.getItem('device_stable_id');
      if (localDeviceId) {
        setCurrentDeviceId(localDeviceId);
      }

      const { data, error: fetchError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const dedupedSessions = deduplicateSessions(data || []);
      setSessions(dedupedSessions);

      // Verify current device from database (fallback)
      if (!localDeviceId) {
        const current = dedupedSessions.find(s => s.is_current_device);
        if (current) {
          setCurrentDeviceId(current.device_stable_id);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch sessions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Trust a device
  const trustDevice = async (deviceStableId: string) => {
    if (!user) return;

    try {
      const session = sessions.find(s => s.device_stable_id === deviceStableId);
      if (!session) return;

      const newTrustedState = !session.is_trusted;

      console.log('🔄 Toggling trust for device:', deviceStableId, 'from', session.is_trusted, 'to', newTrustedState);

      const { error: invokeError } = await supabase.functions.invoke('manage-session', {
        body: {
          action: 'trust',
          sessionData: {
            deviceStableId,
            isTrusted: newTrustedState,
          },
        },
      });

      if (invokeError) throw invokeError;

      console.log('✅ Trust toggle successful');
      toast.success(newTrustedState ? 'Device trusted' : 'Device untrusted');
    } catch (err: any) {
      console.error('❌ Failed to trust device:', err);
      toast.error('Failed to update device trust status');
    }
  };

  // Revoke a session
  const revokeSession = async (deviceStableId: string) => {
    if (!user) return;

    // Prevent revoking current device
    if (deviceStableId === currentDeviceId) {
      toast.error('Cannot revoke current device');
      return;
    }

    try {
      const { error: invokeError } = await supabase.functions.invoke('manage-session', {
        body: {
          action: 'revoke',
          deviceStableId,
        },
      });

      if (invokeError) throw invokeError;

      toast.success('Device logged out successfully');
    } catch (err: any) {
      console.error('Failed to revoke session:', err);
      toast.error('Failed to log out device');
    }
  };

  // Revoke all other devices
  const revokeAllOtherDevices = async () => {
    if (!user || !currentDeviceId) return;

    const otherDevices = sessions.filter(s => s.device_stable_id !== currentDeviceId);
    if (otherDevices.length === 0) {
      toast.info('No other devices to log out');
      return;
    }

    try {
      for (const session of otherDevices) {
        await supabase.functions.invoke('manage-session', {
          body: {
            action: 'revoke',
            sessionData: { deviceStableId: session.device_stable_id },
          },
        });
      }

      toast.success(`Logged out ${otherDevices.length} device(s)`);
    } catch (err: any) {
      console.error('Failed to revoke all devices:', err);
      toast.error('Failed to log out all devices');
    }
  };

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setCurrentDeviceId(null);
      return;
    }

    // Set current device immediately from localStorage
    const localDeviceId = localStorage.getItem('device_stable_id');
    if (localDeviceId) {
      setCurrentDeviceId(localDeviceId);
    }

    console.log('📡 Setting up global sessions realtime subscriptions');

    let sessionsChannel: RealtimeChannel | null = null;
    let revocationsChannel: RealtimeChannel | null = null;

    const setupSubscriptions = async () => {
      // Initial fetch
      await refreshSessions();

      // Subscribe to user_sessions changes
      sessionsChannel = supabase
        .channel('global-sessions-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_sessions',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('📡 Session realtime event:', payload.eventType, payload);

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const newSession = payload.new as UserSession;
              setSessions(prev => {
                const filtered = prev.filter(s => s.device_stable_id !== newSession.device_stable_id);
                return deduplicateSessions([...filtered, newSession]);
              });
            } else if (payload.eventType === 'DELETE') {
              const oldSession = payload.old as UserSession;
              setSessions(prev => prev.filter(s => s.device_stable_id !== oldSession.device_stable_id));
              console.log('🗑️ Session deleted, card removed instantly');
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Global sessions subscription status:', status);
        });

      // Subscribe to session_revocations (instant card removal signal)
      revocationsChannel = supabase
        .channel('global-revocations-signal')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'session_revocations',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('🚨 Revocation signal received:', payload);
            const revocation = payload.new as { device_stable_id: string };
            
            // Remove card instantly (before DELETE event arrives)
            setSessions(prev => prev.filter(s => s.device_stable_id !== revocation.device_stable_id));
            console.log('🗑️ Card removed instantly via revocation signal');
          }
        )
        .subscribe((status) => {
          console.log('📡 Global revocations subscription status:', status);
        });
    };

    setupSubscriptions();

    return () => {
      console.log('🔌 Cleaning up global sessions subscriptions');
      if (sessionsChannel) supabase.removeChannel(sessionsChannel);
      if (revocationsChannel) supabase.removeChannel(revocationsChannel);
    };
  }, [user]);

  const value: SessionsContextValue = {
    sessions,
    loading,
    error,
    currentDeviceId,
    refreshSessions,
    trustDevice,
    revokeSession,
    revokeAllOtherDevices,
  };

  return <SessionsContext.Provider value={value}>{children}</SessionsContext.Provider>;
};

export const useSessions = () => {
  const context = useContext(SessionsContext);
  if (context === undefined) {
    throw new Error('useSessions must be used within a SessionsProvider');
  }
  return context;
};
