
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
  const registerCurrentDevice = useCallback(async () => {
    if (!user) {
      console.log('❌ No user found for device registration');
      return null;
    }

    try {
      // Ensure user profile exists first
      const profileExists = await ensureUserProfile();
      if (!profileExists) {
        console.error('❌ Could not ensure user profile exists');
        return null;
      }

      // Get the profile ID to use for user_sessions
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('❌ Could not get user profile:', profileError);
        return null;
      }

      const fingerprint = generateDeviceFingerprint();
      const fingerprintHash = createFingerprintHash(fingerprint);
      const deviceDetails = detectDeviceDetails(navigator.userAgent);
      
      console.log('🔐 Registering device:', deviceDetails);

      // Check if device already exists by looking for similar fingerprint
      const { data: existingSessions, error: fetchError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('device_fingerprint', fingerprintHash)
        .eq('is_active', true);

      if (fetchError) {
        console.error('❌ Error fetching existing sessions:', fetchError);
        return null;
      }

      let sessionId = null;

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
            user_id: profile.id,
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
        } else {
          console.error('❌ Error creating session:', error);
        }
      }

      return sessionId;
    } catch (error) {
      console.error('❌ Error registering device:', error);
      return null;
    }
  }, [user, generateDeviceFingerprint, createFingerprintHash, detectDeviceDetails, ensureUserProfile]);

  // Load trusted devices
  const loadTrustedDevices = useCallback(async () => {
    if (!user) {
      console.log('❌ No user found for loading devices');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Loading trusted devices for user:', user.id);
      
      // Get the profile ID first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError || !profile) {
        console.log('❌ User profile not found, no devices to load');
        setTrustedDevices([]);
        setLoading(false);
        return;
      }

      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('❌ Error loading sessions:', error);
        setLoading(false);
        return;
      }

      if (sessions) {
        const transformedDevices: TrustedDevice[] = sessions.map(session => {
          const deviceDetails = detectDeviceDetails(session.user_agent || '');
          
          return {
            id: session.id,
            device_name: session.device_name || deviceDetails.deviceName,
            device_type: (session.device_type as any) || deviceDetails.deviceType,
            browser_info: session.browser_info || deviceDetails.browser,
            operating_system: session.operating_system || deviceDetails.operatingSystem,
            device_fingerprint: session.device_fingerprint || '',
            first_seen: session.created_at || new Date().toISOString(),
            last_seen: session.last_activity || new Date().toISOString(),
            is_current: session.id === currentDeviceId,
            is_trusted: session.is_trusted || false,
            login_count: session.login_count || 1,
            location: session.location,
            ip_address: session.ip_address
          };
        });

        console.log('📱 Loaded devices:', transformedDevices.length);
        setTrustedDevices(transformedDevices);
      }
    } catch (error) {
      console.error('❌ Error in loadTrustedDevices:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentDeviceId, detectDeviceDetails]);

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

  // Initialize on mount and when user changes
  useEffect(() => {
    if (user) {
      console.log('🔄 Initializing device session for user:', user.id);
      setLoading(true);
      
      registerCurrentDevice().then((sessionId) => {
        if (sessionId) {
          setCurrentDeviceId(sessionId);
        }
        // Always load devices even if registration fails
        loadTrustedDevices();
      });
    } else {
      // Reset state when user logs out
      setTrustedDevices([]);
      setCurrentDeviceId(null);
      setLoading(false);
    }
  }, [user, registerCurrentDevice, loadTrustedDevices]);

  return {
    trustedDevices,
    currentDeviceId,
    loading,
    registerCurrentDevice,
    loadTrustedDevices,
    toggleDeviceTrust,
    removeDevice
  };
};
