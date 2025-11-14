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
    const SEED_KEY = 'device_seed';

    // Try to read an existing stable ID first (fast path)
    let stableId: string | null = null;
    try {
      stableId = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      console.warn('localStorage unavailable:', e);
    }
    if (!stableId) {
      stableId = getCookie(COOKIE_KEY);
    }

    // Ensure a persistent per-device seed exists
    let seed: string | null = null;
    try {
      seed = localStorage.getItem(SEED_KEY);
    } catch (e) {
      console.warn('localStorage unavailable for seed:', e);
    }
    if (!seed) {
      seed = (crypto && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`;
      try {
        localStorage.setItem(SEED_KEY, seed);
      } catch (e) {
        console.warn('Failed to persist device seed to localStorage:', e);
      }
      try {
        setCookie(SEED_KEY, seed, 730);
      } catch (e) {
        console.warn('Failed to persist device seed to cookie:', e);
      }
    }

    if (!stableId) {
      // Build a robust, collision-resistant fingerprint with a persistent seed
      const raw = [
        navigator.userAgent,
        navigator.platform,
        navigator.language,
        `${screen.width}x${screen.height}`,
        String(navigator.hardwareConcurrency || 0),
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'tz',
        seed,
      ].join('|');

      // Hash with SHA-256 using Web Crypto
      const encoder = new TextEncoder();
      const rawBytes = encoder.encode(raw);
      let hex = '';
      try {
        const digest = await crypto.subtle.digest('SHA-256', rawBytes);
        hex = Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      } catch (e) {
        console.warn('SHA-256 not available, falling back to simple hash (less stable):', e);
        // Fallback to legacy hash to avoid blocking registration
        const fingerprint = this.generateDeviceFingerprint();
        hex = this.hashFingerprint(fingerprint);
      }

      stableId = `dv_${hex.slice(0, 20)}`; // Short, stable, collision-resistant
      console.log('🔑 Generated stable device ID (seeded):', { stableId, seed });

      // Persist for future fast reads
      try {
        localStorage.setItem(STORAGE_KEY, stableId);
      } catch (error) {
        console.warn('localStorage unavailable for stable ID:', error);
      }
      try {
        setCookie(COOKIE_KEY, stableId, 730); // 2 years
      } catch (error) {
        console.warn('Cookie unavailable for stable ID:', error);
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

  // Normalize OS names and versions for consistency
  private normalizeOperatingSystem(os: string | undefined, ua: string): string {
    const raw = (os || '').trim();
    const lower = raw.toLowerCase();

    // iOS normalization
    if (/iphone|ipad|ipod|ios/i.test(ua)) {
      const m = ua.match(/OS\s(\d+)[_.](\d+)?/i);
      if (m) {
        const major = m[1];
        const minor = m[2] || '0';
        return `iOS ${major}.${minor}`;
      }
      return 'iOS';
    }

    // Android normalization
    if (/android/i.test(ua)) {
      const m = ua.match(/Android\s([\d.]+)/i);
      if (m) return `Android ${m[1]}`;
      return 'Android';
    }

    // macOS normalization (map to marketing names when possible)
    if (/mac os x/i.test(ua) || lower.startsWith('mac os') || lower.startsWith('macos')) {
      // Try to read macOS major version from UA like 10_15_7 or 14_2
      const match = ua.match(/Mac OS X\s(\d+)[_.](\d+)/i);
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        // Map modern macOS (11+). Some browsers still report 10_15 for older versions
        if (major >= 14) return `macOS Sonoma ${major}.${minor}`;
        if (major === 13) return `macOS Ventura ${major}.${minor}`;
        if (major === 12) return `macOS Monterey ${major}.${minor}`;
        if (major === 11) return `macOS Big Sur ${major}.${minor}`;
        if (major === 10) return `macOS 10.${minor}`; // Catalina or earlier
      }
      // Fallback to generic label
      return raw || 'macOS';
    }

    // Windows normalization
    if (/windows/i.test(ua) || lower.includes('windows')) {
      const m = ua.match(/Windows NT\s([\d.]+)/i);
      if (m) return `Windows ${m[1]}`;
      return raw || 'Windows';
    }

    return raw || 'Unknown OS';
  }

  // Best-effort extraction of device model from UA (web only)
  private extractModelFromUA(ua: string): string | null {
    // Android models often appear before "Build/" and look like SM-XXXX or similar
    const androidMatch = ua.match(/\((?:[^;]*;){2}\s*([^;\)]+)\s*Build\//i);
    if (androidMatch && androidMatch[1]) {
      return androidMatch[1].trim();
    }
    // iPad/iPhone/iPod hints
    if (/iPad/i.test(ua)) return 'iPad';
    if (/iPhone/i.test(ua)) return 'iPhone';
    if (/iPod/i.test(ua)) return 'iPod';
    return null;
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

  async registerOrUpdateCurrentDevice(userId: string, opts?: { forceReclassify?: boolean }): Promise<string | null> {
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

      // Lock device type on first registration to prevent future overwrites
      const isNewDevice = !existingSession;
      const isLocked = existingSession?.device_type_locked || false;
      const shouldLock = isNewDevice ? true : isLocked; // Lock new devices automatically
      
      // AUTO-CORRECTION: If device was locked as desktop/laptop but UA strongly indicates mobile/tablet, fix it
      let finalType = isLocked && existingSession?.device_type ? existingSession.device_type : normalizedType;
      let finalDeviceName = isLocked && existingSession?.device_name ? existingSession.device_name : details.deviceName;
      
      if (isLocked && existingSession) {
        const storedType = existingSession.device_type;
        const ua = navigator.userAgent;
        const uaMobile = /iPhone|iPod|Android.+Mobile|Windows Phone/i.test(ua);
        const uaTablet = /iPad|Tablet|Kindle|Silk|PlayBook|Galaxy Tab|Android(?!.*Mobile)/i.test(ua);
        const isMacintosh = /Macintosh/i.test(ua);
        const hasTouchPoints = navigator.maxTouchPoints && navigator.maxTouchPoints > 1;
        
        // Strong mobile/tablet detection (always override desktop/laptop)
        const stronglyMobile = uaMobile && !uaTablet;
        const stronglyTablet = uaTablet || (isMacintosh && hasTouchPoints);
        
        if ((storedType === 'desktop' || storedType === 'laptop') && (stronglyMobile || stronglyTablet)) {
          const correctedType = stronglyMobile ? 'mobile' : 'tablet';
          console.log(`✅ Auto-corrected device_type: stableId=${stableDeviceId}, from=${storedType} → to=${correctedType}`);
          finalType = correctedType;
        } else if (opts?.forceReclassify || storedType !== normalizedType) {
          // Safe desktop ↔ laptop reclassification (only when types differ or force)
          if (storedType === 'desktop' || storedType === 'laptop') {
            const strongDesktop = 
              /(imac|mac\s?mini|mac\s?pro|mac\s?studio)/i.test(ua) ||
              screen.width >= 2048 ||
              screen.height >= 1200 ||
              !('getBattery' in navigator);
            
            const strongLaptop = 
              /macbook|notebook|laptop/i.test(ua) ||
              ('getBattery' in navigator);
            
            if (strongDesktop && storedType === 'laptop') {
              console.warn(`⚠️ Reclassifying laptop → desktop (strong desktop signals, forceReclassify=${opts?.forceReclassify})`);
              finalType = 'desktop';
            } else if (strongLaptop && storedType === 'desktop') {
              console.warn(`⚠️ Reclassifying desktop → laptop (strong laptop signals, forceReclassify=${opts?.forceReclassify})`);
              finalType = 'laptop';
            }
          }
        }
      }
      const loginCount = (existingSession?.login_count || 0) + 1;

      console.log('🔄 UPSERT session (one card per device):', {
        stableDeviceId,
        isNewDevice,
        isLocked,
        shouldLock,
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
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Normalize OS and build physical key + model (DB source of truth)
      const finalOperatingSystem = this.normalizeOperatingSystem(details.operatingSystem, navigator.userAgent);
      const finalDeviceModel = details.deviceModel || this.extractModelFromUA(navigator.userAgent) || 'Unknown Model';
      // Use OS family only (ignore version) and DO NOT include screen resolution to avoid duplicate physical keys
      const osFamily = (finalOperatingSystem || 'unknown').toLowerCase().split(' ')[0];
      const physicalKey = `${finalType}|${osFamily}`.toLowerCase();


      console.log('📦 Physical device key generated:', {
        physicalKey,
        deviceModel: finalDeviceModel,
        operatingSystem: finalOperatingSystem,
        screenRes
      });

      // UPSERT: Insert or update based on unique constraint (user_id, device_stable_id)
      const sessionData: any = {
        user_id: userId,
        device_stable_id: stableDeviceId,
        device_name: finalDeviceName,
        device_type: finalType,
        browser_info: details.browser,
        operating_system: finalOperatingSystem, // ✅ Persist normalized OS
        physical_key: physicalKey, // ✅ Persist physical device key
        device_model: finalDeviceModel, // ✅ Persist device model
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
        session_status: 'active', // Trigger auto-syncs is_active to true
        security_alerts: existingSession?.security_alerts || [],
        device_type_locked: shouldLock, // Lock on first registration, preserve existing lock
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
      // Notify UI instantly in case realtime is delayed
      try {
        window.dispatchEvent(new CustomEvent('user-sessions:updated', {
          detail: { userId, sessionId: data.id, type: 'UPSERT' }
        }));
      } catch {}
      return data.id;
    } catch (e) {
      console.error('❌ registerOrUpdateCurrentDevice failed with exception:', e);
      console.error('❌ Exception details:', JSON.stringify(e, null, 2));
      console.error('❌ Stack trace:', (e as Error)?.stack);
      return null;
    }
  }

  /**
   * Repair/reclassify all sessions for a user by recomputing device_type, device_name, OS, physical_key
   * from stored user_agent. This fixes legacy "Mac-only" rows caused by old stableId collisions.
   */
  async repairAllUserSessions(userId: string): Promise<{ repaired: number; errors: string[] }> {
    console.log('🔧 Starting repair of all sessions for user:', userId);
    
    try {
      // Fetch all sessions for this user
      const { data: sessions, error: fetchError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;
      if (!sessions || sessions.length === 0) {
        console.log('⚠️ No sessions found to repair');
        return { repaired: 0, errors: [] };
      }

      console.log(`🔧 Found ${sessions.length} sessions to repair`);

      let repaired = 0;
      const errors: string[] = [];

      for (const session of sessions) {
        try {
          // Reclassify from user_agent
          const ua = session.user_agent || navigator.userAgent;
          const uaData: any = (navigator as any).userAgentData;
          const detected = await detectFromUserAgent(ua, {
            platform: uaData?.platform,
            mobile: uaData?.mobile,
            model: undefined,
          });

          // Recompute physical_key
          const normalizedOS = detected.operatingSystem.split(' ')[0];
          const screenRes = session.screen_resolution || `${screen.width}x${screen.height}`;
          const physicalKey = `${detected.deviceType}_${normalizedOS}_${screenRes}`;

          // Update session with correct classification
          const { error: updateError } = await supabase
            .from('user_sessions')
            .update({
              device_type: detected.deviceType,
              device_name: detected.deviceName,
              operating_system: detected.operatingSystem,
              browser_info: detected.browser,
              physical_key: physicalKey,
              updated_at: new Date().toISOString(),
            })
            .eq('id', session.id);

          if (updateError) {
            errors.push(`Failed to repair session ${session.id}: ${updateError.message}`);
            console.error('❌ Failed to repair session:', session.id, updateError);
          } else {
            repaired++;
            console.log(`✅ Repaired session ${session.id}: ${detected.deviceName} (${detected.deviceType})`);
          }
        } catch (e: any) {
          errors.push(`Error repairing session ${session.id}: ${e.message}`);
          console.error('❌ Error repairing session:', session.id, e);
        }
      }

      console.log(`🔧 Repair complete: ${repaired}/${sessions.length} sessions repaired`);
      return { repaired, errors };
    } catch (e: any) {
      console.error('❌ Repair failed:', e);
      return { repaired: 0, errors: [e.message] };
    }
  }

  async heartbeat(sessionId: string) {
    try {
      await supabase
        .from('user_sessions')
        .update({
          last_activity: new Date().toISOString(),
          session_status: 'active'
        })
        .eq('id', sessionId);
    } catch (e) {
      console.error('❌ heartbeat failed', e);
    }
  }

  async cleanupStaleSessions(userId: string, daysInactive: number = 30): Promise<number> {
    try {
      console.log('🧹 Cleaning up stale sessions:', { userId, daysInactive });

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      // Delete sessions that haven't been updated in X days and are not active
      const { data, error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('is_active', false)
        .lt('updated_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('❌ Failed to cleanup stale sessions:', error);
        throw error;
      }

      const deletedCount = data?.length || 0;
      console.log(`✅ Cleaned up ${deletedCount} stale sessions`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error in cleanupStaleSessions:', error);
      throw error;
    }
  }

  async countStaleSessions(userId: string, daysInactive: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      const { count, error } = await supabase
        .from('user_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', false)
        .lt('updated_at', cutoffDate.toISOString());

      if (error) {
        console.error('❌ Failed to count stale sessions:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ Error in countStaleSessions:', error);
      return 0;
    }
  }
}

export const deviceSessionService = DeviceSessionService.getInstance();
