
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { detectFromUserAgent } from '@/utils/deviceType';
import { deviceSessionService } from '@/services/sessions/DeviceSessionService';
import { UAParser } from 'ua-parser-js';

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
  device_type: 'desktop' | 'laptop' | 'tablet' | 'smartphone' | 'mobile' | 'unknown';
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
  screen_resolution?: string;
  network_provider?: string;
  city?: string;
  country?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  platform_type?: 'web' | 'ios' | 'android' | 'pwa';
  app_version?: string;
  hardware_info?: any;
  mfa_enabled?: boolean;
  security_alerts?: any[];
  session_status?: 'active' | 'logged_in' | 'inactive';
}

export const useDeviceSession = () => {
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { user } = useAuth();
  const initializedRef = useRef(false);
  const loadDevicesRef = useRef<((opts?: { silent?: boolean }) => Promise<void>)>();
  const realtimeDebounceTimer = useRef<number | null>(null);
  const lastRealtimeAtRef = useRef<number>(0);
  const isRealtimeLoadingRef = useRef<boolean>(false);
  const isLoggingOutRef = useRef<boolean>(false);
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

  // Detect device details from user agent (robust via UA parser + rules)
  const detectDeviceDetails = useCallback(async (userAgent: string) => {
    const uaData: any = (navigator as any).userAgentData;
    const details = await detectFromUserAgent(userAgent, {
      platform: uaData?.platform,
      mobile: uaData?.mobile,
      model: undefined,
    });
    return {
      deviceType: details.deviceType === 'mobile' ? 'smartphone' : details.deviceType, // keep backward compat in UI
      deviceName: details.deviceName,
      browser: details.browser,
      operatingSystem: details.operatingSystem,
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
        .eq('id', user.id)
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
            id: user.id, // Ensure PK matches auth.uid() to satisfy FKs
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
      const deviceDetails = await detectDeviceDetails(navigator.userAgent);

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
        // Update existing session - preserve locked device type
        const existingSession = existingSessions[0];
        const newLoginCount = (existingSession.login_count || 0) + 1;

        // If device_type_locked is true, reuse existing device_type; otherwise detect fresh
        const isLocked = existingSession.device_type_locked || false;
        const finalDeviceType = isLocked 
          ? existingSession.device_type 
          : (deviceDetails.deviceType === 'smartphone' ? 'mobile' : deviceDetails.deviceType);
        
        console.log('🔒 Device type lock status:', {
          isLocked,
          existingType: existingSession.device_type,
          detectedType: deviceDetails.deviceType,
          finalType: finalDeviceType
        });

        const { data, error } = await supabase
          .from('user_sessions')
          .update({
            last_activity: new Date().toISOString(),
            login_count: newLoginCount,
            user_agent: navigator.userAgent,
            device_name: deviceDetails.deviceName,
            device_type: finalDeviceType,
            browser_info: deviceDetails.browser,
            operating_system: deviceDetails.operatingSystem,
          })
          .eq('id', existingSession.id)
          .select()
          .single();

        if (!error && data) {
          sessionId = data.id;
          console.log('✅ Updated existing device session:', sessionId);
        }
      } else {
        // Create new session with enhanced device information
        const screenRes = `${screen.width}x${screen.height}`;
        const hardwareInfo = {
          cpu: navigator.hardwareConcurrency || 'Unknown',
          memory: (navigator as any).deviceMemory || 'Unknown',
          platform: navigator.platform,
        };
        
        // Normalize device type for storage (convert 'smartphone' to 'mobile')
        const normalizedDeviceType = deviceDetails.deviceType === 'smartphone' 
          ? 'mobile' 
          : deviceDetails.deviceType;
        
        console.log('📱 Creating new session with device type:', {
          detected: deviceDetails.deviceType,
          normalized: normalizedDeviceType,
          deviceName: deviceDetails.deviceName
        });

        const { data, error } = await supabase
          .from('user_sessions')
          .insert({
            user_id: userId,
            device_name: deviceDetails.deviceName,
            device_type: normalizedDeviceType,
            browser_info: deviceDetails.browser,
            operating_system: deviceDetails.operatingSystem,
            device_fingerprint: fingerprintHash,
            is_trusted: false,
            login_count: 1,
            user_agent: navigator.userAgent,
            last_activity: new Date().toISOString(),
            is_active: true,
            session_token: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            screen_resolution: screenRes,
            platform_type: 'web',
            hardware_info: hardwareInfo,
            mfa_enabled: false,
            session_status: 'active',
            security_alerts: [],
            device_type_locked: false, // Allow re-detection until manually locked
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
  const loadTrustedDevices = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;
    if (!user) {
      console.log('❌ No user found for loading devices');
      setTrustedDevices([]);
      if (!silent) setError('No authenticated user found');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Loading trusted devices for user:', user.id);
      if (!silent) setError(null);

      // Load all sessions that are 'active' OR 'logged_in' (not just is_active flag)
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .or('is_active.eq.true,session_status.eq.logged_in,session_status.eq.active')
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('❌ Error loading sessions:', error);
        const errorMsg = `Failed to load devices: ${error.message}`;
        if (!silent) {
          setError(errorMsg);
          toast.error(errorMsg);
        }
        setLoading(false);
        return;
      }

      if (sessions) {
        const currentFingerprint = createFingerprintHash(generateDeviceFingerprint());
        console.log(`🔍 Found ${sessions.length} sessions for user ${user.id}`);

        if (sessions.length === 0) {
          console.log('⚠️ No sessions found - user may need to register device');
          setTrustedDevices([]);
          if (!silent) setError('No devices found. Try refreshing or logging in again.');
          setLoading(false);
          return;
        }

        // Backend now enforces uniqueness by device_stable_id. No client deduplication needed.
        const dedupedSessions = sessions;
        console.log('📱 All sessions (backend deduplicated):', dedupedSessions.length);

        const transformedDevices: TrustedDevice[] = await Promise.all(dedupedSessions.map(async (session: any) => {
          const isCurrentDevice = session.device_fingerprint === currentFingerprint;

          // Use stored database values directly - backend already detected and persisted
          const deviceName = session.device_name || 'Unknown Device';
          const deviceType = session.device_type || 'unknown';
          const browserInfo = session.browser_info || 'Unknown Browser';
          const operatingSystem = session.operating_system || 'Unknown OS';

          return {
            id: session.id,
            device_name: deviceName,
            device_type: deviceType as TrustedDevice['device_type'],
            browser_info: browserInfo,
            operating_system: operatingSystem,
            device_fingerprint: session.device_fingerprint || '',
            first_seen: session.created_at || new Date().toISOString(),
            last_seen: session.last_activity || new Date().toISOString(),
            is_current: isCurrentDevice,
            is_trusted: session.is_trusted || false,
            login_count: session.login_count || 1,
            location: session.location || 'Unknown location',
            ip_address: session.ip_address,
            city: session.city,
            country: session.country,
            country_code: session.country_code,
            latitude: session.latitude,
            longitude: session.longitude,
            platform_type: session.platform_type,
            session_status: session.session_status
          };
        }));

        console.log('📱 Loaded devices (deduped):', transformedDevices.length);
        setTrustedDevices(transformedDevices);
        if (!silent) setError(null);

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
      if (!silent) {
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [user, detectDeviceDetails, createFingerprintHash, generateDeviceFingerprint]);

  // Store ref to loadTrustedDevices to prevent infinite loops in real-time subscription
  useEffect(() => {
    loadDevicesRef.current = loadTrustedDevices;
  }, [loadTrustedDevices]);

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

  // Remove device with instant logout enforcement
  const removeDevice = useCallback(async (deviceId: string) => {
    if (!user) return;

    try {
      // Mark that we're intentionally logging out (to prevent self-logout)
      isLoggingOutRef.current = true;
      
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', deviceId);

      if (!error) {
        await loadTrustedDevices();
        toast.success('Device removed successfully');
      }
      
      // Reset logout flag after a delay
      setTimeout(() => {
        isLoggingOutRef.current = false;
      }, 2000);
    } catch (error) {
      console.error('❌ Error removing device:', error);
      toast.error('Failed to remove device');
      isLoggingOutRef.current = false;
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
      // Ensure profile exists first
      await ensureUserProfile();

      // Re-register current device via global service to ensure this device is up to date
      const sessionId = user ? await deviceSessionService.registerOrUpdateCurrentDevice(user.id) : null;
      if (sessionId) {
        setCurrentDeviceId(sessionId);
        console.log('✅ Current device re-registered (global service):', sessionId);
      }
      
      // Then load all devices
      await loadTrustedDevices();
      toast.success('Devices refreshed successfully');
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      toast.error('Failed to refresh devices');
    }
  }, [user, registerCurrentDevice, loadTrustedDevices]);

  // Initialize on mount and when user changes (prevent duplicate runs)
  useEffect(() => {
    if (!user) {
      // Reset state when user logs out
      initializedRef.current = false;
      setTrustedDevices([]);
      setCurrentDeviceId(null);
      setError(null);
      setLoading(false);
      setRealtimeStatus('disconnected');
      return;
    }

    // Prevent duplicate initialization
    if (initializedRef.current) {
      console.log('⏭️ Already initialized, skipping');
      return;
    }

    console.log('🔄 Initializing device session for user:', user.id);
    initializedRef.current = true;
    setLoading(true);
    setError(null);
    
    // Initialize with async function to avoid dependency issues
    const initialize = async () => {
      try {
        // Step 0: Ensure user profile exists to satisfy FK and RLS
        const profileOk = await ensureUserProfile();
        if (!profileOk) {
          console.warn('⚠️ Could not ensure user profile exists; continuing and relying on existing state.');
        }

        // Step 1: Load all devices (registration handled globally by SessionBootstrapper)
        await loadTrustedDevices();

        // Step 2: Safety net - if NO sessions exist, force register current device
        // This ensures the current device ALWAYS appears, even if bootstrap missed it
        if (trustedDevices.length === 0 && user) {
          console.log('⚠️ No devices found after load - registering current device as safety net');
          const sessionId = await deviceSessionService.registerOrUpdateCurrentDevice(user.id);
          if (sessionId) {
            setCurrentDeviceId(sessionId);
            console.log('✅ Safety net: Current device registered:', sessionId);
            // Wait 200ms then reload to show the new device
            await new Promise(resolve => setTimeout(resolve, 200));
            await loadTrustedDevices();
          }
        }
      } catch (error) {
        console.error('❌ Initialization failed:', error);
        setError(`Initialization failed: ${error}`);
        toast.error('Failed to initialize device session');
        setLoading(false);
      }
    };
    
    initialize();
  }, [user?.id]); // Only depend on user.id to avoid stale closures

  // Real-time subscription for session changes (stable - no dependency loops)
  useEffect(() => {
    if (!user) {
      setRealtimeStatus('disconnected');
      return;
    }

    console.log('🔄 Setting up real-time subscription for user sessions');
    setRealtimeStatus('connecting');

    const channel = supabase
      .channel(`user-sessions-${user.id}`)
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
          
          // FAST PATH: New device logins (INSERT events) should appear instantly
          if (payload.eventType === 'INSERT') {
            console.log('⚡ Fast-pathing INSERT event for instant UI update');
            
            // Clear any pending timer
            if (realtimeDebounceTimer.current) {
              window.clearTimeout(realtimeDebounceTimer.current);
            }
            
            // Minimal debounce (50ms) for INSERT, NO throttle
            realtimeDebounceTimer.current = window.setTimeout(() => {
              loadDevicesRef.current?.({ silent: true });
            }, 50);
            return;
          }
          
          // For UPDATE/DELETE events, use normal throttle + debounce to prevent flicker
          const now = Date.now();
          if (now - lastRealtimeAtRef.current < 1500) {
            console.log('⏱️ Throttling UPDATE/DELETE event (too soon)');
            return;
          }
          lastRealtimeAtRef.current = now;

          if (realtimeDebounceTimer.current) {
            window.clearTimeout(realtimeDebounceTimer.current);
          }
          realtimeDebounceTimer.current = window.setTimeout(() => {
            loadDevicesRef.current?.({ silent: true });
          }, 300);
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
  }, [user?.id]); // Only depend on user.id - no callback dependencies

  // Real-time instant logout enforcement - monitors current device session
  useEffect(() => {
    if (!user || !currentDeviceId) {
      return;
    }

    console.log('🔐 Setting up instant logout enforcement for current device:', currentDeviceId);

    const currentFingerprint = createFingerprintHash(generateDeviceFingerprint());
    
    const logoutChannel = supabase
      .channel(`logout-enforcement-${user.id}-${currentDeviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_sessions',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const updatedSession = payload.new as any;
          
          // Check if this update is for the current device
          const isCurrentDevice = updatedSession.device_fingerprint === currentFingerprint;
          
          // If current device session was deactivated and we're not the one triggering logout
          if (isCurrentDevice && updatedSession.is_active === false && !isLoggingOutRef.current) {
            console.log('🚨 Current device session deactivated - forcing instant logout');
            
            // Import and trigger immediate logout
            const { immediateLogoutService } = await import('@/utils/auth/immediateLogoutService');
            await immediateLogoutService.performImmediateLogout();
            
            // Redirect to login
            window.location.href = '/login';
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Instant logout enforcement active');
        }
      });

    return () => {
      console.log('🔄 Cleaning up logout enforcement subscription');
      supabase.removeChannel(logoutChannel);
    };
  }, [user?.id, currentDeviceId, createFingerprintHash, generateDeviceFingerprint]);

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
