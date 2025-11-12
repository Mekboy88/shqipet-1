
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DeviceFingerprint {
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenResolution: string;
  colorDepth: number;
  deviceMemory?: number;
  hardwareConcurrency: number;
}

interface TrustedDevice {
  id: string;
  device_name: string;
  device_type: 'desktop' | 'laptop' | 'tablet' | 'smartphone' | 'unknown';
  browser_info: string;
  operating_system: string;
  device_fingerprint: string;
  first_seen: string;
  last_seen: string;
  is_current: boolean;
  is_trusted: boolean;
  login_count: number;
  location?: string;
  ip_address?: string;
}

export const useDeviceSession = () => {
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { user } = useAuth();

  // Generate device fingerprint
  const generateDeviceFingerprint = useCallback((): DeviceFingerprint => {
    const nav = navigator as any;
    
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      deviceMemory: nav.deviceMemory || 0,
      hardwareConcurrency: navigator.hardwareConcurrency || 0
    };
  }, []);

  // Detect device details from user agent
  const detectDeviceDetails = useCallback((userAgent: string) => {
    const ua = userAgent.toLowerCase();
    
    // Operating System Detection
    let os = 'Unknown OS';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    // Device Type Detection
    let deviceType: 'desktop' | 'laptop' | 'tablet' | 'smartphone' | 'unknown' = 'unknown';
    let deviceName = 'Unknown Device';

    if (ua.includes('mobile') || ua.includes('android') && !ua.includes('tablet')) {
      deviceType = 'smartphone';
      if (ua.includes('iphone')) deviceName = 'iPhone';
      else if (ua.includes('android')) deviceName = 'Android Phone';
      else deviceName = 'Mobile Device';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = 'tablet';
      if (ua.includes('ipad')) deviceName = 'iPad';
      else deviceName = 'Android Tablet';
    } else if (ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) {
      // Detect laptop vs desktop based on screen size and other indicators
      const screenWidth = screen.width;
      const isTouchDevice = 'ontouchstart' in window;
      
      if (screenWidth <= 1366 || isTouchDevice || ua.includes('mobile')) {
        deviceType = 'laptop';
        deviceName = os === 'macOS' ? 'MacBook' : `${os} Laptop`;
      } else {
        deviceType = 'desktop';
        deviceName = os === 'macOS' ? 'Mac' : `${os} PC`;
      }
    }

    // Browser Detection
    let browser = 'Unknown Browser';
    if (ua.includes('chrome') && !ua.includes('edge')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';
    else if (ua.includes('opera')) browser = 'Opera';

    return {
      deviceType,
      deviceName,
      browser,
      operatingSystem: os
    };
  }, []);

  // Create device fingerprint hash
  const createFingerprintHash = useCallback((fingerprint: DeviceFingerprint): string => {
    const data = JSON.stringify(fingerprint);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }, []);

  // Ensure user profile exists
  const ensureUserProfile = useCallback(async () => {
    if (!user) return false;

    try {
      // Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Error checking profile:', profileError);
        return false;
      }

      // If profile doesn't exist, create it
      if (!existingProfile) {
        console.log('🔄 Creating user profile...');
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id, // Add the required user_id field
            auth_user_id: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            email_verified: user.email_confirmed_at ? true : false,
            phone_verified: user.phone_confirmed_at ? true : false,
            phone_number: user.phone || ''
          });

        if (createError) {
          console.error('❌ Error creating profile:', createError);
          return false;
        }
        console.log('✅ User profile created successfully');
      }

      return true;
    } catch (error) {
      console.error('❌ Error ensuring user profile:', error);
      return false;
    }
  }, [user]);

  // Register current device
  // Register current device (no profile dependency)
  const registerCurrentDevice = useCallback(async () => {
    if (!user) {
      console.log('❌ No user found for device registration');
      return null;
    }

    try {
      const userId = user.id;
      const fingerprint = generateDeviceFingerprint();
      const fingerprintHash = createFingerprintHash(fingerprint);
      const deviceDetails = detectDeviceDetails(navigator.userAgent);

      // Check if device already exists and is active
      const { data: existingSessions, error: fetchError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('device_fingerprint', fingerprintHash)
        .eq('is_active', true);

      if (fetchError) {
        console.error('❌ Error fetching existing sessions:', fetchError);
        return null;
      }

      let sessionId: string | null = null;

      if (existingSessions && existingSessions.length > 0) {
        // Update existing session
        const existingSession = existingSessions[0];
        const newLoginCount = (existingSession.login_count || 0) + 1;

        const { data, error } = await supabase
          .from('user_sessions')
          .update({
            last_activity: new Date().toISOString(),
            login_count: newLoginCount,
            user_agent: navigator.userAgent
          })
          .eq('id', existingSession.id)
          .select()
          .single();

        if (!error && data) {
          sessionId = data.id;
          console.log('✅ Updated existing device session:', sessionId);
        }
      } else {
        // Create new session
        const { data, error } = await supabase
          .from('user_sessions')
          .insert({
            user_id: userId,
            device_name: deviceDetails.deviceName,
            device_type: deviceDetails.deviceType,
            browser_info: deviceDetails.browser,
            operating_system: deviceDetails.operatingSystem,
            device_fingerprint: fingerprintHash,
            is_trusted: false,
            login_count: 1,
            user_agent: navigator.userAgent,
            last_activity: new Date().toISOString(),
            is_active: true,
            session_token: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          })
          .select()
          .single();

        if (!error && data) {
          sessionId = data.id;
          console.log('✅ Created new device session:', sessionId);
        } else if (error) {
          console.error('❌ Error creating session:', error);
        }
      }

      return sessionId;
    } catch (error) {
      console.error('❌ Error registering device:', error);
      return null;
    }
  }, [user, generateDeviceFingerprint, createFingerprintHash, detectDeviceDetails]);

  // Load trusted devices with improved error handling
  const loadTrustedDevices = useCallback(async () => {
    if (!user) {
      console.log('❌ No user found for loading devices');
      setTrustedDevices([]);
      setError('No authenticated user found');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Loading trusted devices for user:', user.id);
      setError(null);

      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('❌ Error loading sessions:', error);
        const errorMsg = `Failed to load devices: ${error.message}`;
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      if (sessions) {
        const currentFingerprint = createFingerprintHash(generateDeviceFingerprint());
        console.log(`🔍 Found ${sessions.length} active sessions for user ${user.id}`);

        if (sessions.length === 0) {
          console.log('⚠️ No active sessions found - user may need to register device');
          setTrustedDevices([]);
          setError('No devices found. Try refreshing or logging in again.');
          setLoading(false);
          return;
        }

        const transformedDevices: TrustedDevice[] = sessions.map(session => {
          const deviceDetails = detectDeviceDetails(session.user_agent || '');
          const isCurrentDevice = session.device_fingerprint === currentFingerprint;

          return {
            id: session.id,
            device_name: session.device_name || deviceDetails.deviceName,
            device_type: (session.device_type as any) || deviceDetails.deviceType,
            browser_info: session.browser_info || deviceDetails.browser,
            operating_system: session.operating_system || deviceDetails.operatingSystem,
            device_fingerprint: session.device_fingerprint || '',
            first_seen: session.created_at || new Date().toISOString(),
            last_seen: session.last_activity || new Date().toISOString(),
            is_current: isCurrentDevice,
            is_trusted: session.is_trusted || false,
            login_count: session.login_count || 1,
            location: session.location || 'Unknown location',
            ip_address: session.ip_address
          };
        });

        console.log('📱 Loaded devices:', transformedDevices.length);
        setTrustedDevices(transformedDevices);
        setError(null);

        // Update current device ID if found
        const currentDevice = transformedDevices.find(d => d.is_current);
        if (currentDevice) {
          setCurrentDeviceId(currentDevice.id);
          console.log('✅ Found current device:', currentDevice.id);
        } else {
          console.log('⚠️ Current device not found in session list');
        }
      }
    } catch (error) {
      console.error('❌ Error in loadTrustedDevices:', error);
      const errorMsg = `Failed to load devices: ${error}`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [user, detectDeviceDetails, createFingerprintHash, generateDeviceFingerprint]);

  // Trust/untrust device
  const toggleDeviceTrust = useCallback(async (deviceId: string, trusted: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_trusted: trusted })
        .eq('id', deviceId);

      if (!error) {
        await loadTrustedDevices();
        toast.success(trusted ? 'Device marked as trusted' : 'Device trust removed');
      }
    } catch (error) {
      console.error('❌ Error toggling device trust:', error);
      toast.error('Failed to update device trust status');
    }
  }, [user, loadTrustedDevices]);

  // Remove device
  const removeDevice = useCallback(async (deviceId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', deviceId);

      if (!error) {
        await loadTrustedDevices();
        toast.success('Device removed successfully');
      }
    } catch (error) {
      console.error('❌ Error removing device:', error);
      toast.error('Failed to remove device');
    }
  }, [user, loadTrustedDevices]);

  // Manual refresh function
  const refreshDevices = useCallback(async () => {
    if (!user) {
      toast.error('No user logged in');
      return;
    }
    
    console.log('🔄 Manual refresh triggered');
    setLoading(true);
    setError(null);
    
    try {
      // Re-register current device first
      const sessionId = await registerCurrentDevice();
      if (sessionId) {
        setCurrentDeviceId(sessionId);
        console.log('✅ Current device re-registered:', sessionId);
      }
      
      // Then load all devices
      await loadTrustedDevices();
      toast.success('Devices refreshed successfully');
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      toast.error('Failed to refresh devices');
    }
  }, [user, registerCurrentDevice, loadTrustedDevices]);

  // Initialize on mount and when user changes (simplified dependencies)
  useEffect(() => {
    if (!user) {
      // Reset state when user logs out
      setTrustedDevices([]);
      setCurrentDeviceId(null);
      setError(null);
      setLoading(false);
      setRealtimeStatus('disconnected');
      return;
    }

    console.log('🔄 Initializing device session for user:', user.id);
    setLoading(true);
    setError(null);
    
    // Initialize with async function to avoid dependency issues
    const initialize = async () => {
      try {
        // Step 1: Register current device
        const sessionId = await registerCurrentDevice();
        if (sessionId) {
          setCurrentDeviceId(sessionId);
          console.log('✅ Device registered with ID:', sessionId);
        } else {
          console.log('⚠️ Device registration failed, continuing with load...');
        }
        
        // Step 2: Load all devices (including the one just registered)
        await loadTrustedDevices();
      } catch (error) {
        console.error('❌ Initialization failed:', error);
        setError(`Initialization failed: ${error}`);
        toast.error('Failed to initialize device session');
        setLoading(false);
      }
    };
    
    initialize();
  }, [user?.id]); // Only depend on user.id to avoid stale closures

  // Real-time subscription for session changes (improved)
  useEffect(() => {
    if (!user) {
      setRealtimeStatus('disconnected');
      return;
    }

    console.log('🔄 Setting up real-time subscription for user sessions');
    setRealtimeStatus('connecting');

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
        (payload) => {
          console.log('🔔 Real-time session change received:', payload.eventType, payload.new?.id);
          // Debounce rapid updates
          setTimeout(() => {
            loadTrustedDevices();
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active for user sessions');
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          console.log('❌ Real-time subscription error');
          setRealtimeStatus('disconnected');
        } else if (status === 'TIMED_OUT') {
          console.log('⏰ Real-time subscription timed out');
          setRealtimeStatus('disconnected');
        }
      });

    return () => {
      console.log('🔄 Cleaning up real-time subscription');
      setRealtimeStatus('disconnected');
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // Only depend on user.id

  return {
    trustedDevices,
    currentDeviceId,
    loading,
    error,
    realtimeStatus,
    lastRefresh,
    registerCurrentDevice,
    loadTrustedDevices,
    refreshDevices,
    toggleDeviceTrust,
    removeDevice
  };
};
