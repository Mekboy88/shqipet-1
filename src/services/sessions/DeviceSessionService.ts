import { supabase } from '@/integrations/supabase/client';
import { detectFromUserAgent } from '@/utils/deviceType';

type PlatformType = 'web' | 'pwa' | 'ios' | 'android';

class DeviceSessionService {
  private static instance: DeviceSessionService;

  static getInstance() {
    if (!DeviceSessionService.instance) {
      DeviceSessionService.instance = new DeviceSessionService();
    }
    return DeviceSessionService.instance;
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

  async registerOrUpdateCurrentDevice(userId: string): Promise<string | null> {
    try {
      console.log('🚀 Starting device registration for user:', userId);
      console.log('📱 User Agent:', navigator.userAgent);
      console.log('🖥️ Platform:', navigator.platform);
      console.log('📐 Screen:', `${screen.width}x${screen.height}`);
      
      const fingerprint = this.createFingerprint();
      console.log('🔑 Device fingerprint:', fingerprint);
      
      const details = await detectFromUserAgent(navigator.userAgent);
      console.log('🔍 Device detection result:', details);
      
      // Fallback UA-based detection to correct misclassifications
      const ua = navigator.userAgent;
      const uaMobile = /iPhone|Android.+Mobile|Windows Phone/i.test(ua);
      const uaTablet = /iPad|Tablet|Kindle|Silk|PlayBook|Galaxy Tab|Android(?!.*Mobile)/i.test(ua);
      let normalizedType = details.deviceType;
      
      if ((normalizedType === 'desktop' || normalizedType === 'laptop') && (uaMobile || uaTablet)) {
        const override = uaMobile ? 'mobile' : 'tablet';
        console.warn(`⚠️ Detected as ${normalizedType} but UA indicates ${override} - overriding to ${override}`);
        normalizedType = override as any;
      }
      
      const platform_type = this.detectPlatformType();
      console.log('🌐 Platform type:', platform_type);

      console.log('🔐 Global device registration:', {
        userId,
        fingerprint,
        deviceType: normalizedType,
        platformType: platform_type,
        deviceName: details.deviceName,
        browser: details.browser,
        os: details.operatingSystem
      });

      // Ensure profile exists to satisfy FK before inserting into user_sessions
      await this.ensureProfile(userId);

      // Check for existing active session for this device
      console.log('🔍 Checking for existing session with fingerprint:', fingerprint);
      const { data: existing, error: fetchErr } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('device_fingerprint', fingerprint)
        .order('updated_at', { ascending: false });

      if (fetchErr) {
        console.error('❌ Fetch session error:', fetchErr);
        console.error('❌ Error details:', JSON.stringify(fetchErr, null, 2));
        return null;
      }
      
      console.log('📋 Existing sessions found:', existing?.length || 0);

      const now = new Date().toISOString();

      if (existing && existing.length > 0) {
        const s = existing[0];
        const isLocked = !!s.device_type_locked;
        const finalType = isLocked ? s.device_type : normalizedType;
        
        console.log('🔄 Updating existing session:', s.id, { isLocked, finalType });
        
        const { data, error } = await supabase
          .from('user_sessions')
          .update({
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
          })
          .eq('id', s.id)
          .select()
          .single();

        if (!error && data) {
          console.log('✅ Session updated:', data.id);
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
        
        const sessionData = {
          user_id: userId,
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
