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
   * Generate device fingerprint for stable ID generation
   */
  private generateDeviceFingerprint(): any {
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
  }

  /**
   * Create deterministic hash from fingerprint
   */
  private hashFingerprint(fingerprint: any): string {
    const data = JSON.stringify(fingerprint);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
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
      // Generate deterministic stable ID based on device fingerprint
      // This ensures same physical device gets same ID even if storage is blocked
      const fingerprint = this.generateDeviceFingerprint();
      const fingerprintHash = this.hashFingerprint(fingerprint);
      stableId = `dv_${fingerprintHash}`;
      
      console.log('🔑 Generated deterministic stable ID from fingerprint:', stableId);
      
      // Store in both localStorage and cookie for faster access (best-effort)
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
      console.log('🌍 Fetching IP and geolocation (non-blocking)...');
      
      // Set 5-second timeout to prevent blocking device registration
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
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
      // Non-blocking: log error but continue registration without geo data
      console.warn('⚠️ IP/geolocation fetch failed (non-blocking, continuing):', error);
      return null;
    }
  }

  async registerOrUpdateCurrentDevice(userId: string): Promise<string | null> {
    try {
      console.log('🔄 Starting device registration for user:', userId);
      
      // 1. Get native device info first (if available)
      const nativeInfo = await this.getNativeDeviceInfo();
      console.log('🔧 Native device info:', nativeInfo);

      // 2. Get stable device ID (native or web-based)
      const stableDeviceId = await this.getStableDeviceId(nativeInfo);
      
      // 3. Create fingerprint for web fallback (not used for native)
      const fingerprint = nativeInfo ? stableDeviceId : this.createFingerprint();
      console.log('🔐 Device identifiers:', { stableDeviceId, fingerprint, isNative: !!nativeInfo });

      // 4. Fetch IP and geolocation (non-blocking - registration continues even if this fails)
      let geoData = null;
      try {
        geoData = await this.fetchIPAndGeolocation();
      } catch (geoError) {
        console.warn('⚠️ Geolocation fetch failed, continuing without geo data:', geoError);
      }

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
        
        // Standardize deviceType from detectFromUserAgent to 4 canonical types
        if (details.deviceType === 'smartphone') {
          normalizedType = 'mobile';
        } else {
          normalizedType = details.deviceType;
        }
        
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
        deviceModel: details.deviceModel,
        browser: details.browser,
        os: details.operatingSystem,
        isNative: !!nativeInfo
      });

      // Ensure profile exists to satisfy FK before inserting into user_sessions
      await this.ensureProfile(userId);

      // Fetch existing session to respect locked fields
      const { data: existingSession } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('device_stable_id', stableDeviceId)
        .order('last_activity', { ascending: false })
        .limit(1)
        .single();

      const isLocked = existingSession?.device_type_locked || false;
      const finalType = isLocked && existingSession?.device_type ? existingSession.device_type : normalizedType;
      const finalDeviceName = isLocked && existingSession?.device_name ? existingSession.device_name : details.deviceName;
      const loginCount = (existingSession?.login_count || 0) + 1;

      console.log('🔄 UPSERT session (one card per device):', {
        stableDeviceId,
        isLocked,
        finalType,
        finalDeviceName,
        loginCount
      });

      const now = new Date().toISOString();
      const screenRes = `${screen.width}x${screen.height}`;
      const hardwareInfo = {
        cpu: navigator.hardwareConcurrency || 'Unknown',
        memory: (navigator as any).deviceMemory || 'Unknown',
        platform: navigator.platform,
      };

      // UPSERT: Insert or update based on unique constraint (user_id, device_stable_id)
      const sessionData: any = {
        user_id: userId,
        device_stable_id: stableDeviceId,
        device_name: finalDeviceName,
        device_type: finalType,
        browser_info: details.browser,
        operating_system: details.operatingSystem,
        device_fingerprint: fingerprint,
        login_count: loginCount,
        user_agent: navigator.userAgent,
        last_activity: now,
        is_active: true,
        session_token: existingSession?.session_token || `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        screen_resolution: screenRes,
        platform_type,
        hardware_info: hardwareInfo,
        mfa_enabled: existingSession?.mfa_enabled || false,
        session_status: 'active',
        security_alerts: existingSession?.security_alerts || [],
        device_type_locked: isLocked,
        is_trusted: existingSession?.is_trusted || false,
      };

      // Add geolocation if available
      if (geoData) {
        sessionData.ip_address = geoData.ip;
        sessionData.city = geoData.city;
        sessionData.country = geoData.country;
        sessionData.country_code = geoData.country_code;
        sessionData.latitude = geoData.latitude;
        sessionData.longitude = geoData.longitude;
      }

      const { data, error } = await supabase
        .from('user_sessions')
        .upsert(sessionData, {
          onConflict: 'user_id,device_stable_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ UPSERT failed:', error);
        return null;
      }

      console.log('✅ Session UPSERT successful:', data.id, '- Stable ID:', stableDeviceId);
      return data.id;
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
