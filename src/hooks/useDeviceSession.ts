import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';

// Device session interface
interface DeviceSession {
  id: string;
  user_id: string;
  device_stable_id: string;
  device_fingerprint: string;
  device_type: string;
  operating_system: string;
  browser_info: string;
  platform_type: string;
  screen_resolution: string;
  timezone: string;
  last_activity: string;
  is_active: boolean;
  session_status: 'active' | 'inactive' | 'logged_out' | 'logged_in';
  is_current?: boolean;
  is_trusted?: boolean;
  ip_address?: string;
  city?: string;
  country?: string;
  country_code?: string;
  location?: string;
  first_seen?: string;
  last_seen?: string;
  login_count?: number;
  all_browsers?: string[];
  session_count?: number;
  device_name?: string;
  all_stable_ids?: string[];
  latitude?: number;
  longitude?: number;
}

// KEY for storing stable device ID
const STABLE_ID_KEY = "shqipet_device_stable_id";

function getStableDeviceId(): string {
  let id = localStorage.getItem(STABLE_ID_KEY);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STABLE_ID_KEY, id);
  }

  return id;
}

export const useDeviceSession = () => {
  const { user } = useAuth();
  const [trustedDevices, setTrustedDevices] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [currentStableId] = useState<string>(getStableDeviceId());

  // Find current device ID from the list
  const currentDeviceId = trustedDevices.find(d => d.is_current)?.id || null;

  const refreshDevices = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (fetchError) throw fetchError;

      const currentStableId = getStableDeviceId();
      const sessions = (data || []).map(session => ({
        ...session,
        is_current: session.device_stable_id === currentStableId
      }));

      setTrustedDevices(sessions);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const toggleDeviceTrust = useCallback(async (deviceId: string, trusted: boolean) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_trusted: trusted })
        .eq('id', deviceId);

      if (error) throw error;

      await refreshDevices();
    } catch (err: any) {
      console.error('Error toggling device trust:', err);
      throw err;
    }
  }, [refreshDevices]);

  const removeDevice = useCallback(async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false, session_status: 'logged_out' })
        .eq('id', deviceId);

      if (error) throw error;

      await refreshDevices();
    } catch (err: any) {
      console.error('Error removing device:', err);
      throw err;
    }
  }, [refreshDevices]);

  const logoutAllOtherDevices = useCallback(async () => {
    if (!user?.id) return;

    try {
      const currentStableId = getStableDeviceId();

      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false, session_status: 'logged_out' })
        .eq('user_id', user.id)
        .neq('device_stable_id', currentStableId);

      if (error) throw error;

      await refreshDevices();
    } catch (err: any) {
      console.error('Error logging out other devices:', err);
      throw err;
    }
  }, [user?.id, refreshDevices]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      refreshDevices();
    }
  }, [user?.id, refreshDevices]);

  // Setup realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('user-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refreshDevices();
        }
      )
      .subscribe((status) => {
        setRealtimeStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, refreshDevices]);

  return {
    trustedDevices,
    currentDeviceId,
    currentStableId,
    loading,
    error,
    realtimeStatus,
    lastRefresh,
    refreshDevices,
    toggleDeviceTrust,
    removeDevice,
    logoutAllOtherDevices
  };
};
