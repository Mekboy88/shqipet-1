import { supabase } from '@/integrations/supabase/client';
import { detectFromUserAgent } from '@/utils/deviceType';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

type PlatformType = 'web' | 'pwa' | 'ios' | 'android';

interface NativeDeviceInfo {
  isNative: boolean;
  deviceId?: string;
  model?: string;
  platform?: string;
  osVersion?: string;
  manufacturer?: string;
}

// Cookie helpers for stable device ID persistence
const setCookie = (name: string, value: string, days: number = 730) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift()!);
  return null;
};

class DeviceSessionService {
  private static instance: DeviceSessionService;

  static getInstance() {
    if (!DeviceSessionService.instance) {
      DeviceSessionService.instance = new DeviceSessionService();
    }
    return DeviceSessionService.instance;
  }

  /**
   * Get native device info from Capacitor Device API
   * Returns null if not running on native platform
   */
  private async getNativeDeviceInfo(): Promise<NativeDeviceInfo | null> {
    try {
      // Check if running on native platform
      if (!Capacitor.isNativePlatform()) {
        console.log('📱 Not running on native platform, using browser detection');
        return null;
      }

      console.log('📱 Native platform detected, fetching device info...');

      // Get device ID (unique hardware identifier)
      const deviceId = await Device.getId();
      
      // Get device info (model, platform, OS version, etc.)
      const info = await Device.getInfo();

      console.log('✅ Native device info retrieved:', {
        id: deviceId.identifier,
        model: info.model,
        platform: info.platform,
        osVersion: info.osVersion,
        manufacturer: info.manufacturer
      });

      return {
        isNative: true,
        deviceId: deviceId.identifier,
        model: info.model,
        platform: info.platform,
        osVersion: info.osVersion,
        manufacturer: info.manufacturer
      };
    } catch (error) {
      console.warn('⚠️ Failed to get native device info:', error);
      return null;
    }
  }

  /**
   * Get or generate a stable device ID that persists across sessions
   * Uses Capacitor Device.getId() for native apps, localStorage + cookie fallback for web
   */
  async getStableDeviceId(nativeInfo?: NativeDeviceInfo | null): Promise<string> {
    // If we have native device ID, use it directly (most reliable)
    if (nativeInfo?.deviceId) {
      console.log('📱 Using native device ID:', nativeInfo.deviceId);
      return nativeInfo.deviceId;
    }

    const STORAGE_KEY = 'device_stable_id';
    const COOKIE_KEY = 'device_stable_id';
    
    // Try localStorage first
    let stableId: string | null = null;
    try {
      stableId = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      console.warn('localStorage unavailable:', e);
    }
    
    // Fallback to cookie if localStorage unavailable/blocked
    if (!stableId) {
      stableId = getCookie(COOKIE_KEY);
    }
    
    if (!stableId) {
      // Generate new stable ID
      stableId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Store in both localStorage and cookie (best-effort)
      try {
        localStorage.setItem(STORAGE_KEY, stableId);
      } catch (error) {
        console.warn('localStorage unavailable:', error);
      }
      
      try {
        setCookie(COOKIE_KEY, stableId, 730); // 2 years
      } catch (error) {
        console.warn('Cookie unavailable:', error);
      }
    }
    
    return stableId;
  }

  // Ensure a profile row exists to satisfy FK user_sessions.user_id -> profiles.id
  private async ensureProfile(userId: string): Promise<boolean> {
    try {
      const { data: existing, error: selErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      if (existing) return true;
      if (selErr && selErr.code !== 'PGRST116') {
        console.warn('⚠️ ensureProfile: select error (continuing):', selErr);
      }
      const { error: insErr } = await supabase.from('profiles').insert({
        id: userId,
        auth_user_id: userId,
      });
      if (insErr) {
        console.warn('⚠️ ensureProfile: insert failed (may already exist due to race):', insErr);
        return false;
      }
      console.log('✅ ensureProfile: profile created');
      return true;
    } catch (e) {
      console.warn('⚠️ ensureProfile: exception (continuing):', e);
      return false;
    }
  }
  
  private createFingerprint(): string {
    const nav = navigator as any;
    const payload = JSON.stringify({
      ua: navigator.userAgent,
      platform: navigator.platform,
      lang: navigator.language,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      res: `${screen.width}x${screen.height}`,
      depth: screen.colorDepth,
      mem: nav.deviceMemory || 0,
      cores: navigator.hardwareConcurrency || 0,
    });
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      hash = ((hash << 5) - hash) + payload.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  private detectPlatformType(): PlatformType {
    // PWA standalone detection
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return 'pwa';

    // Native wrapper heuristic (if you later wrap this web app with Capacitor)
    const ua = navigator.userAgent.toLowerCase();
    const hasCapacitor = typeof (window as any).Capacitor !== 'undefined';
    if (hasCapacitor || ua.includes('capacitor') || ua.includes('wv;')) {
      if (/iphone|ipad|ipod|ios/.test(ua)) return 'ios';
      if (/android/.test(ua)) return 'android';
    }

    return 'web';
  }

  private async fetchIPAndGeolocation(): Promise<{
    ip: string;
    city: string;
    country: string;
    country_code: string;
    latitude: number;
    longitude: number;
  } | null> {
    try {
      console.log('🌍 Fetching IP and geolocation...');
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      console.log('✅ IP & Geolocation fetched:', {
        ip: data.ip,
        city: data.city,
        country: data.country_name,
        country_code: data.country_code
      });
      
      return {
        ip: data.ip || 'Unknown',
        city: data.city || 'Unknown',
        country: data.country_name || 'Unknown',
        country_code: data.country_code || 'XX',
        latitude: parseFloat(data.latitude) || 0,
        longitude: parseFloat(data.longitude) || 0
      };
    } catch (error) {
      console.error('❌ Failed to fetch IP/geolocation:', error);
      return null;
    }
  }

  async registerOrUpdateCurrentDevice(userId: string): Promise<string | null> {
    try {
      // 1. Get native device info first (if available)
      const nativeInfo = await this.getNativeDeviceInfo();
      console.log('🔧 Native device info:', nativeInfo);

      // 2. Get stable device ID (native or web-based)
      const stableDeviceId = await this.getStableDeviceId(nativeInfo);
      
      // 3. Create fingerprint for web fallback (not used for native)
      const fingerprint = nativeInfo ? stableDeviceId : this.createFingerprint();
      console.log('🔐 Device identifiers:', { stableDeviceId, fingerprint, isNative: !!nativeInfo });

      // 4. Fetch IP and geolocation
      const geoData = await this.fetchIPAndGeolocation();

      // 5. Detect device details
      let details: any;
      let normalizedType: string;
      let platform_type: PlatformType;

      if (nativeInfo) {
        // Native app: use real hardware info
        console.log('📱 Using native device detection');
        
        // Map native platform to device type
        const platform = nativeInfo.platform?.toLowerCase() || '';
        if (platform === 'ios' || platform === 'android') {
          // Determine if tablet or mobile based on model name
          const model = nativeInfo.model?.toLowerCase() || '';
          normalizedType = (model.includes('ipad') || model.includes('tablet')) ? 'tablet' : 'mobile';
        } else {
          normalizedType = 'desktop';
        }

        platform_type = (platform === 'ios' || platform === 'android') ? platform as PlatformType : 'web';

        details = {
          deviceName: nativeInfo.model || 'Unknown Device',
          deviceModel: nativeInfo.model || 'Unknown',
          browser: 'Native App',
          operatingSystem: `${nativeInfo.platform || 'Unknown'} ${nativeInfo.osVersion || ''}`.trim(),
          manufacturer: nativeInfo.manufacturer || 'Unknown'
        };

        console.log('✅ Native device details:', details);
      } else {
        // Web browser: use UA detection
        console.log('🌐 Using browser-based detection');
        details = await detectFromUserAgent(navigator.userAgent);
        normalizedType = details.deviceType;
        
        // Apply UA-based overrides for web
        const ua = navigator.userAgent;
        const uaMobile = /iPhone|iPod|Android.+Mobile|Windows Phone/i.test(ua);
        const uaTablet = /iPad|Tablet|Kindle|Silk|PlayBook|Galaxy Tab|Android(?!.*Mobile)/i.test(ua);
        
        const isMacintosh = /Macintosh/i.test(ua);
        const hasTouchPoints = navigator.maxTouchPoints && navigator.maxTouchPoints > 1;
        
        if (isMacintosh && hasTouchPoints) {
          normalizedType = 'tablet';
          console.log('🔍 Detected iPadOS via Macintosh + touch points');
        }
        
        if ((normalizedType === 'desktop' || normalizedType === 'laptop') && (uaMobile || uaTablet)) {
          const override = uaMobile ? 'mobile' : 'tablet';
          console.warn(`⚠️ Detected as ${normalizedType} but UA indicates ${override} - overriding to ${override}`);
          normalizedType = override as any;
        }
        
        platform_type = this.detectPlatformType();
      }

      console.log('🔐 Global device registration:', {
        userId,
        stableDeviceId,
        fingerprint,
        deviceType: normalizedType,
        platformType: platform_type,
        deviceName: details.deviceName,
        isNative: !!nativeInfo
      });

      // Ensure profile exists to satisfy FK before inserting into user_sessions
      await this.ensureProfile(userId);

      // Check for existing session for this device
      // Priority 1: Try by fingerprint FIRST (to connect with existing sessions)
      console.log('🔍 Checking for existing session by fingerprint:', fingerprint);
      let existing = null;
      let foundByMethod = 'none';
      
      const { data: fingerprintSessions, error: fetchErr } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('device_fingerprint', fingerprint)
        .eq('is_active', true)
        .order('last_activity', { ascending: false })
        .limit(1);

      if (fingerprintSessions && fingerprintSessions.length > 0) {
        existing = fingerprintSessions;
        foundByMethod = 'fingerprint';
        console.log('✅ Found session by fingerprint, will update stable_id to:', stableDeviceId);
      } else {
        // Priority 2: Try by stable device ID (for sessions already migrated)
        console.log('🔍 No fingerprint match, trying stable ID:', stableDeviceId);
        const { data: stableSessions, error: stableErr } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('device_stable_id', stableDeviceId)
          .eq('is_active', true)
          .order('last_activity', { ascending: false })
          .limit(1);

        if (stableSessions && stableSessions.length > 0) {
          existing = stableSessions;
          foundByMethod = 'stable_id';
          console.log('✅ Found session by stable ID');
        }
      }

      console.log('📋 Existing sessions found:', existing?.length || 0, `(by ${foundByMethod})`);

      const now = new Date().toISOString();

      if (existing && existing.length > 0) {
        const s = existing[0];
        const isLocked = !!s.device_type_locked;
        const finalType = isLocked ? s.device_type : normalizedType;
        
        console.log('🔄 Updating existing session:', s.id, { 
          isLocked, 
          finalType, 
          foundByMethod,
          willUpdateStableId: foundByMethod === 'fingerprint' 
        });
        
        const updateData: any = {
          device_stable_id: stableDeviceId, // CRITICAL: Update stable ID on every login
          last_activity: now,
          login_count: (s.login_count || 0) + 1,
          user_agent: navigator.userAgent,
          device_name: details.deviceName,
          device_type: finalType,
          browser_info: details.browser,
          operating_system: details.operatingSystem,
          platform_type,
          session_status: 'active',
          is_active: true
        };
        
        // Add IP and geolocation data if fetched successfully
        if (geoData) {
          updateData.ip_address = geoData.ip;
          updateData.city = geoData.city;
          updateData.country = geoData.country;
          updateData.country_code = geoData.country_code;
          updateData.latitude = geoData.latitude;
          updateData.longitude = geoData.longitude;
          console.log('📍 Adding geolocation to update:', geoData);
        }
        
        const { data, error } = await supabase
          .from('user_sessions')
          .update(updateData)
          .eq('id', s.id)
          .select()
          .single();

        if (!error && data) {
          console.log('✅ Session updated:', data.id, '- Stable ID now:', stableDeviceId);
          // Deactivate other active sessions for the same physical device (same stable ID or fingerprint)
          try {
            await supabase
              .from('user_sessions')
              .update({ is_active: false, session_status: 'inactive' })
              .eq('user_id', userId)
              .neq('id', data.id)
              .or(`device_stable_id.eq.${stableDeviceId},device_fingerprint.eq.${fingerprint}`);
          } catch (cleanupErr) {
            console.warn('⚠️ Cleanup of duplicate sessions failed:', cleanupErr);
          }
          return data.id;
        }
        return s.id || null;
      } else {
        const screenRes = `${screen.width}x${screen.height}`;
        const hardwareInfo = {
          cpu: navigator.hardwareConcurrency || 'Unknown',
          memory: (navigator as any).deviceMemory || 'Unknown',
          platform: navigator.platform,
        };

        console.log('➕ Creating new session for device:', details.deviceName);
        
        const sessionData: any = {
          user_id: userId,
          device_stable_id: stableDeviceId, // THIS IS THE KEY FIELD!
          device_name: details.deviceName,
          device_type: normalizedType,
          browser_info: details.browser,
          operating_system: details.operatingSystem,
          device_fingerprint: fingerprint,
          is_trusted: false,
          login_count: 1,
          user_agent: navigator.userAgent,
          last_activity: now,
          is_active: true,
          session_token: `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
          screen_resolution: screenRes,
          platform_type,
          hardware_info: hardwareInfo,
          mfa_enabled: false,
          session_status: 'active',
          security_alerts: [],
          device_type_locked: false
        };
        
        // Add IP and geolocation data if fetched successfully
        if (geoData) {
          sessionData.ip_address = geoData.ip;
          sessionData.city = geoData.city;
          sessionData.country = geoData.country;
          sessionData.country_code = geoData.country_code;
          sessionData.latitude = geoData.latitude;
          sessionData.longitude = geoData.longitude;
          console.log('📍 Adding geolocation to new session:', geoData);
        }
        
        console.log('📝 Inserting session data:', JSON.stringify(sessionData, null, 2));

         const { data, error } = await supabase
          .from('user_sessions')
          .insert(sessionData)
          .select()
          .single();

        if (!error && data) {
          console.log('✅ New session created successfully!');
          console.log('✅ Session ID:', data.id);
          console.log('✅ Device Type:', data.device_type);
          console.log('✅ Device Name:', data.device_name);

          // Deactivate other active sessions for the same physical device (same stable ID or fingerprint)
          try {
            await supabase
              .from('user_sessions')
              .update({ is_active: false, session_status: 'inactive' })
              .eq('user_id', userId)
              .neq('id', data.id)
              .or(`device_stable_id.eq.${stableDeviceId},device_fingerprint.eq.${fingerprint}`);
          } catch (cleanupErr) {
            console.warn('⚠️ Cleanup of duplicate sessions failed:', cleanupErr);
          }

          return data.id;
        } else if (error) {
          console.error('❌ Error creating session:', error);
          console.error('❌ Error code:', error.code);
          console.error('❌ Error message:', error.message);
          console.error('❌ Error details:', JSON.stringify(error, null, 2));
        }
        return null;
      }
    } catch (e) {
      console.error('❌ registerOrUpdateCurrentDevice failed with exception:', e);
      console.error('❌ Exception details:', JSON.stringify(e, null, 2));
      console.error('❌ Stack trace:', (e as Error)?.stack);
      return null;
    }
  }

  async heartbeat(sessionId: string) {
    try {
      await supabase
        .from('user_sessions')
        .update({
          last_activity: new Date().toISOString(),
          session_status: 'active',
          is_active: true
        })
        .eq('id', sessionId);
    } catch (e) {
      console.error('❌ heartbeat failed', e);
    }
  }
}

export const deviceSessionService = DeviceSessionService.getInstance();
