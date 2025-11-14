
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { detectFromUserAgent } from '@/utils/deviceType';
import { deviceSessionService } from '@/services/sessions/DeviceSessionService';
import { immediateLogoutService } from '@/utils/auth/immediateLogoutService';
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
  device_stable_id?: string;
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
  // Physical device grouping
  physical_key?: string;
  all_browsers?: string[];
  all_session_ids?: string[];
  all_stable_ids?: string[];
  session_count?: number;
}

export const useDeviceSession = () => {
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [currentStableId, setCurrentStableId] = useState<string | null>(null);
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
  // DEPRECATED: Legacy function - use deviceSessionService.registerOrUpdateCurrentDevice instead
  const registerCurrentDevice = useCallback(async () => {
    console.warn('⚠️ DEPRECATED: registerCurrentDevice in useDeviceSession - use deviceSessionService instead');
    if (!user) {
      console.log('❌ No user found for device registration');
      return null;
    }

    try {
      // Delegate to global service which uses stable ID correctly
      return await deviceSessionService.registerOrUpdateCurrentDevice(user.id);
    } catch (error) {
      console.error('❌ Error registering device:', error);
      return null;
    }
  }, [user]);

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

      // Load all sessions for this user (active and inactive) so the UI can show everything
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
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

        // Group primarily by stable ID to guarantee 1 card per actual device; fallback to physical_key
        const createGroupKey = (session: any): string => {
          if (session.device_stable_id) return `stable:${session.device_stable_id}`;
          const storedKey = session.physical_key;
          if (storedKey && typeof storedKey === 'string') {
            const key = storedKey.toLowerCase();
            const parts = key.split('|');
            // If old format type|os|screen, normalize to type|os
            if (parts.length >= 3) return `${parts[0]}|${parts[1]}`;
            return key;
          }
          // Fallback for legacy sessions without physical_key: type + OS family (ignore version), no screen res
          const osFamily = (session.operating_system || 'unknown-os').toLowerCase().split(' ')[0];
          const deviceType = (session.device_type || 'unknown').toLowerCase();
          return `${deviceType}|${osFamily}`.toLowerCase();
        };

        // Debug logging - what sessions do we have?
        console.log('🔍 DEBUG: All sessions from DB:', sessions.map(s => ({
          id: s.id.substring(0, 8),
          device_name: s.device_name,
          device_type: s.device_type,
          browser: s.browser_info,
          stable_id: s.device_stable_id,
          screen: s.screen_resolution,
          os: s.operating_system,
          is_active: s.is_active,
        })));

        // Group all sessions by physical device
        const physicalDeviceMap = new Map<string, any[]>();
        
        sessions.forEach(session => {
          const physicalKey = createGroupKey(session);
          if (!physicalDeviceMap.has(physicalKey)) {
            physicalDeviceMap.set(physicalKey, []);
          }
          physicalDeviceMap.get(physicalKey)!.push(session);
        });

        console.log('🔍 DEBUG: Physical device groups:', Array.from(physicalDeviceMap.entries()).map(([key, sessions]) => ({
          key,
          count: sessions.length,
          stable_ids: sessions.map(s => s.device_stable_id),
          browsers: sessions.map(s => s.browser_info),
        })));

        // For each physical device, create a merged session showing all browsers
        const dedupedSessions = Array.from(physicalDeviceMap.entries()).map(([physicalKey, deviceSessions]) => {
          // Sort by most recent activity
          deviceSessions.sort((a, b) => 
            new Date(b.last_activity || b.updated_at).getTime() - 
            new Date(a.last_activity || a.updated_at).getTime()
          );

          // Use most recent session as base, but collect all browsers
          const primarySession = deviceSessions[0];
          const allBrowsers = [...new Set(deviceSessions.map(s => s.browser_info).filter(Boolean))];
          const allSessionIds = deviceSessions.map(s => s.id);
          const allStableIds = deviceSessions.map(s => s.device_stable_id).filter(Boolean);
          const isAnyActive = deviceSessions.some(s => s.is_active === true);

          return {
            ...primarySession,
            physical_key: physicalKey,
            all_browsers: allBrowsers,
            all_session_ids: allSessionIds,
            all_stable_ids: allStableIds,
            session_count: deviceSessions.length,
            is_active: isAnyActive,
          };
        });

        console.log(`📱 Grouped ${sessions.length} sessions into ${dedupedSessions.length} physical devices`);
        console.log('📱 Physical device breakdown (ALL TYPES):', dedupedSessions.map(d => ({
          device: d.device_name,
          type: d.device_type,
          platform: d.platform_type,
          browsers: d.all_browsers,
          sessionCount: d.session_count,
          screen: d.screen_resolution,
          physicalKey: d.physical_key,
          isActive: d.is_active,
        })));
        
        // CRITICAL: Show ALL devices regardless of type or active status
        console.log('🚨 RENDERING ALL DEVICE TYPES - mobile, tablet, desktop, laptop, android, iOS');


        // Get current stable ID
        const currentStableIdValue = await deviceSessionService.getStableDeviceId();
        setCurrentStableId(currentStableIdValue);
        console.log('🔑 DEBUG: Current browser stable ID:', currentStableIdValue);
        
        // Also generate current fingerprint hash for fallback matching
        const currentFingerprintHash = createFingerprintHash(generateDeviceFingerprint());
        console.log('🔑 DEBUG: Current browser fingerprint hash:', currentFingerprintHash);

        const transformedDevices: TrustedDevice[] = (await Promise.all(dedupedSessions.map(async (session: any) => {
          // Check if this physical device includes the current browser session
          const allStableIds = session.all_stable_ids || [];
          const matchByStableId = allStableIds.includes(currentStableIdValue);
          
          // Fallback: also check by fingerprint match
          const matchByFingerprint = session.device_fingerprint === currentFingerprintHash;
          
          const isCurrentDevice = matchByStableId || matchByFingerprint;

          console.log('🔍 DEBUG: Checking device group:', {
            device_name: session.device_name,
            device_type: session.device_type,
            all_stable_ids: allStableIds,
            current_stable_id: currentStableIdValue,
            device_fingerprint: session.device_fingerprint,
            current_fingerprint_hash: currentFingerprintHash,
            match_by_stable_id: matchByStableId,
            match_by_fingerprint: matchByFingerprint,
            is_current_match: isCurrentDevice,
            all_browsers: session.all_browsers,
            physical_key: session.physical_key,
          });


          // Prefer stored database values
          let deviceName = session.device_name || 'Unknown Device';
          let deviceType = session.device_type || 'unknown';
          let browserInfo = session.browser_info || '';
          let operatingSystem = session.operating_system || '';

          // Show combined browser info if multiple browsers
          if (session.all_browsers && session.all_browsers.length > 1) {
            browserInfo = `${session.all_browsers.length} browsers`;
          } else if (session.all_browsers && session.all_browsers.length === 1) {
            browserInfo = session.all_browsers[0];
          }

          // We now strictly trust the DATABASE values to avoid mismatches
          // No UA re-detection here; the registration service is the single source of truth
          // deviceName/deviceType/browserInfo/operatingSystem already set above from DB
          // Keep 'smartphone' alias normalized to 'mobile'
          if (deviceType === 'smartphone') {
            deviceType = 'mobile';
          }

          // Display STRICTLY from DB values - NO UA-based overrides
          browserInfo = browserInfo || 'Unknown Browser';
          operatingSystem = operatingSystem || 'Unknown OS';

          // Normalize 'smartphone' to 'mobile' for canonical storage (UI handles both)
          if (deviceType === 'smartphone') {
            deviceType = 'mobile';
          }

          // Final fallbacks
          browserInfo = browserInfo || 'Unknown Browser';
          operatingSystem = operatingSystem || 'Unknown OS';

          return {
            id: session.id,
            device_name: deviceName,
            device_type: deviceType as TrustedDevice['device_type'],
            browser_info: browserInfo,
            operating_system: operatingSystem,
            device_fingerprint: session.device_fingerprint || '',
            device_stable_id: session.device_stable_id,
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
            session_status: session.session_status,
            // Physical device grouping
            physical_key: session.physical_key,
            all_browsers: session.all_browsers || [],
            all_session_ids: session.all_session_ids || [],
            all_stable_ids: session.all_stable_ids || [],
            session_count: session.session_count || 1,
          };
        }))).filter(Boolean) as TrustedDevice[]; // Remove nulls from skipped sessions

        console.log('📱 FINAL: Showing ALL devices (mobile, tablet, desktop, laptop):', transformedDevices.length);
        console.log('📱 FINAL: Device types in list:', transformedDevices.map(d => ({
          name: d.device_name,
          type: d.device_type,
          isCurrent: d.is_current,
          isActive: d.session_status,
        })));
        
        setTrustedDevices(transformedDevices);

        if (!silent) setError(null);

        // Update current device ID if found
        const currentDevice = transformedDevices.find(d => d.is_current);
        if (currentDevice) {
          setCurrentDeviceId(currentDevice.id);
          console.log('✅ Found current device:', {
            id: currentDevice.id,
            name: currentDevice.device_name,
            type: currentDevice.device_type,
            stableIds: currentDevice.all_stable_ids,
          });
        } else {
          console.log('⚠️ Current device not found in session list - will auto-register');
          console.log('⚠️ Current stable ID:', currentStableIdValue);
          console.log('⚠️ Available devices:', transformedDevices.map(d => ({
            name: d.device_name,
            type: d.device_type,
            stableIds: d.all_stable_ids,
          })));
          setCurrentDeviceId(null);
          
          // Auto-register current device if not found (SessionBootstrapper should handle this)
          if (!silent && user?.id) {
            try {
              console.log('🔄 Auto-registering current device...');
              await deviceSessionService.registerOrUpdateCurrentDevice(user.id, { forceReclassify: true });
              console.log('✅ Current device registered, reloading devices...');
              
              // Reload devices after registration
              setTimeout(() => {
                loadTrustedDevices({ silent: true });
              }, 1000);
            } catch (error) {
              console.error('❌ Failed to auto-register current device:', error);
            }
          }
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

  // Remove device with instant logout enforcement (ALL sessions for this physical device)
  const removeDevice = useCallback(async (deviceId: string) => {
    if (!user) return;

    const deviceToRemove = trustedDevices.find(d => d.id === deviceId);
    if (!deviceToRemove) {
      toast.error('Device not found');
      return;
    }

    try {
      console.log('🚪 Logging out physical device:', deviceToRemove.device_name);
      console.log('🗑️ Will end ALL sessions:', deviceToRemove.all_session_ids);

      // Mark that we're intentionally logging out (to prevent self-logout)
      isLoggingOutRef.current = true;
      
      // Mark ALL sessions for this physical device as inactive
      const sessionIdsToRemove = deviceToRemove.all_session_ids || [deviceId];
      
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false, 
          session_status: 'inactive' 
        })
        .in('id', sessionIdsToRemove);

      if (!error) {
        console.log(`✅ Logged out ${sessionIdsToRemove.length} session(s) for this device`);
        
        // Check if we just logged out the current device
        const currentStableIds = deviceToRemove.all_stable_ids || [];
        if (currentStableIds.includes(currentStableId || '')) {
          toast.success('Current device logged out - redirecting...');
          await immediateLogoutService.performImmediateLogout();
          window.location.href = '/login';
          return;
        }

        await loadTrustedDevices();
        toast.success(`Device logged out (${sessionIdsToRemove.length} session(s) ended)`);
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
  }, [user, trustedDevices, currentStableId, loadTrustedDevices]);

  // Logout all other devices (bulk update)
  const logoutAllOtherDevices = useCallback(async () => {
    if (!user) {
      toast.error('No user logged in');
      return;
    }
    
    if (!currentStableId) {
      toast.error('Current device ID not resolved yet. Please wait and try again.');
      return;
    }

    try {
      console.log('🚪 Logging out all other devices (bulk update)');
      console.log('🔑 Keeping current stable ID:', currentStableId);
      
      // Ensure current device session is registered/active before bulk logout
      await deviceSessionService.registerOrUpdateCurrentDevice(user.id);
      
      // Update ALL sessions where device_stable_id != currentStableId
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false, 
          session_status: 'inactive' 
        })
        .eq('user_id', user.id)
        .neq('device_stable_id', currentStableId);

      if (error) {
        console.error('❌ Error logging out other devices:', error);
        toast.error('Failed to logout other devices');
        return;
      }

      console.log('✅ All other devices marked as inactive');
      toast.success('All other devices logged out successfully');
      
      // Reload device list
      await loadTrustedDevices();
    } catch (error) {
      console.error('❌ Error in logoutAllOtherDevices:', error);
      toast.error('Failed to logout other devices');
    }
  }, [user, currentStableId, loadTrustedDevices]);

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
  }, [user, loadTrustedDevices]);

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

  // Instant UI refresh on local UPSERT completion (custom event fallback for realtime)
  useEffect(() => {
    const onLocalUpdated = (e: Event) => {
      if (!user) return;
      // Load without flicker
      loadDevicesRef.current?.({ silent: true });
    };
    window.addEventListener('user-sessions:updated', onLocalUpdated as EventListener);
    return () => {
      window.removeEventListener('user-sessions:updated', onLocalUpdated as EventListener);
    };
  }, [user?.id]);

  // Guarantee real-time, automatic reclassification on mount, visibility, and resize
  useEffect(() => {
    if (!user?.id) return;

    let resizeTimer: number | null = null;

    const ensureCurrent = async () => {
      try {
        await deviceSessionService.registerOrUpdateCurrentDevice(user.id, { forceReclassify: true });
      } catch (e) {
        console.warn('⚠️ ensureCurrent reclassify failed', e);
      }
    };

    // Run once immediately to correct any stale classification
    ensureCurrent();

    const onVis = () => {
      if (document.visibilityState === 'visible') ensureCurrent();
    };
    const onResize = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(ensureCurrent, 400);
    };

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', onResize);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
      if (resizeTimer) window.clearTimeout(resizeTimer);
    };
  }, [user?.id]);


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
          
          // CRITICAL: Match by stable ID ONLY
          const sessionStableId = updatedSession.device_stable_id;
          if (!sessionStableId) {
            console.warn('⚠️ Realtime logout check: session missing stable ID');
            return;
          }
          
          const isCurrentDevice = sessionStableId === currentStableId;
          
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

  // Repair all user sessions (reclassify device_type, device_name, OS, physical_key)
  const repairAllSessions = useCallback(async () => {
    if (!user?.id) return { repaired: 0, errors: ['No user ID'] };
    
    try {
      const result = await deviceSessionService.repairAllUserSessions(user.id);
      if (result.repaired > 0) {
        // Reload devices after repair
        await loadDevicesRef.current?.({ silent: true });
      }
      return result;
    } catch (e: any) {
      console.error('❌ Failed to repair sessions:', e);
      return { repaired: 0, errors: [e.message] };
    }
  }, [user?.id]);

  return {
    trustedDevices,
    currentDeviceId,
    currentStableId,
    loading,
    error,
    realtimeStatus,
    lastRefresh,
    registerCurrentDevice,
    loadTrustedDevices,
    refreshDevices,
    toggleDeviceTrust,
    removeDevice,
    logoutAllOtherDevices,
    repairAllSessions
  };
};
