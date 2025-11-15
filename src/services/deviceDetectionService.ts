import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
  deviceId: string;
  deviceStableId: string;
  deviceType: 'mobile' | 'tablet' | 'laptop' | 'desktop';
  operatingSystem: string;
  browserName: string;
  browserVersion: string;
  screenResolution: string;
  platform: string;
  userAgent: string;
}

class DeviceDetectionService {
  private readonly STORAGE_KEY = 'device_stable_id';

  /**
   * Generate or retrieve stable device ID from localStorage
   * Privacy-compliant: uses random seed, NOT hardware identifiers
   */
  private getOrCreateStableId(): string {
    let stableId = localStorage.getItem(this.STORAGE_KEY);
    if (!stableId) {
      // Generate random UUID-based stable ID
      stableId = crypto.randomUUID();
      localStorage.setItem(this.STORAGE_KEY, stableId);
    }
    return stableId;
  }

  /**
   * Detect actual device type using user agent, touch support, and screen characteristics
   * 
   * Comprehensive Screen Size Ranges:
   * 
   * MOBILE (< 768px):
   * - 320px: iPhone SE, older phones
   * - 360px: Common Android phones
   * - 375px: iPhone 6/7/8, iPhone X/11 Pro
   * - 390px: iPhone 12/13 Pro
   * - 393px: Pixel 5, Samsung Galaxy S21
   * - 414px: iPhone 6/7/8 Plus, iPhone 11/XR
   * - 428px: iPhone 12/13 Pro Max
   * - 480px: Small tablets in portrait
   * - 640px: Large phones, phablets
   * - 768px: Small tablets in portrait (boundary)
   * 
   * TABLET (768px - 1024px):
   * - 768px: iPad Mini, iPad (portrait)
   * - 800px: Small Android tablets
   * - 810px: iPad Air (portrait)
   * - 820px: iPad Pro 11" (portrait)
   * - 834px: iPad Pro 10.5" (portrait)
   * - 912px: Surface Go
   * - 1024px: iPad (landscape), standard tablet (boundary)
   * 
   * LAPTOP (1024px - 1920px):
   * - 1024px: Small laptops, netbooks
   * - 1280px: 13" laptops (1280x720, 1280x800)
   * - 1366px: Common laptop resolution (1366x768)
   * - 1440px: 14" laptops (1440x900)
   * - 1536px: 15" laptops with scaling
   * - 1600px: 15" MacBook Pro
   * - 1680px: 15" laptops (1680x1050)
   * - 1728px: Your specific case (1728x1117)
   * - 1920px: Full HD laptops (boundary)
   * 
   * DESKTOP (>= 1920px):
   * - 1920px: Full HD monitors (1920x1080)
   * - 2560px: QHD/2K monitors (2560x1440)
   * - 3440px: Ultrawide monitors (3440x1440)
   * - 3840px: 4K monitors (3840x2160)
   * - 5120px: 5K monitors (5120x2880)
   * - 7680px: 8K monitors (7680x4320)
   */
  private detectDeviceType(): 'mobile' | 'tablet' | 'laptop' | 'desktop' {
    const result = UAParser(navigator.userAgent);
    const deviceType = result.device?.type;
    const ua = navigator.userAgent.toLowerCase();
    
    // Get the most accurate viewport dimensions for current device
    const viewportWidth = window.innerWidth;
    const screenWidth = window.screen.width;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Debug logging to see what's being detected
    console.log('🔍 Device Detection for Current Device:', {
      viewportWidth,
      screenWidth,
      deviceType,
      hasTouch,
      userAgent: navigator.userAgent
    });
    
    // Special case: iPadOS reports as Mac with touch
    const isIpadLike = /mac os x/.test(ua) && (navigator.platform === 'MacIntel') && navigator.maxTouchPoints > 1;
    if (isIpadLike) {
      console.log('✅ Detected: iPad/Tablet (iPadOS detection)');
      return 'tablet';
    }
    
    // Priority 1: Explicit mobile devices by UA for phones
    const isMobilePhone = (ua.includes('mobile') || (ua.includes('android') && !ua.includes('tablet'))) && viewportWidth < 768;
    if (isMobilePhone) {
      console.log('✅ Detected: Mobile (UA + viewport < 768px)');
      return 'mobile';
    }
    
    // Priority 2: Explicit tablet devices by UA
    const isTabletUA = ua.includes('ipad') || ua.includes('tablet') || (ua.includes('android') && !ua.includes('mobile'));
    if (isTabletUA || deviceType === 'tablet') {
      console.log('✅ Detected: Tablet (UA or device type)');
      return 'tablet';
    }
    
    // Priority 3: Screen size-based detection (MOST RELIABLE for current device)
    // This ensures 100% accuracy based on actual viewport width
    if (viewportWidth < 768) {
      console.log('✅ Detected: Mobile (viewport < 768px)');
      return 'mobile';
    }
    if (viewportWidth >= 768 && viewportWidth < 1024) {
      console.log('✅ Detected: Tablet (768px ≤ viewport < 1024px)');
      return 'tablet';
    }
    if (viewportWidth >= 1024 && viewportWidth < 1920) {
      console.log('✅ Detected: Laptop (1024px ≤ viewport < 1920px)', { viewportWidth });
      return 'laptop';
    }
    
    // Priority 4: Desktop for large screens
    console.log('✅ Detected: Desktop (viewport ≥ 1920px)');
    return 'desktop';
  }

  /**
   * Get comprehensive device information for current device
   */
  getDeviceInfo(): DeviceInfo {
    const parser = new UAParser();
    const result = parser.getResult();
    
    const deviceType = this.detectDeviceType();
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    
    console.log('📱 Current Device Info:', {
      deviceType,
      screenResolution,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    });

    return {
      deviceId: crypto.randomUUID(),
      deviceStableId: this.getOrCreateStableId(),
      deviceType,
      operatingSystem: result.os.name || 'Unknown',
      browserName: result.browser.name || 'Unknown',
      browserVersion: result.browser.version || 'Unknown',
      screenResolution,
      platform: navigator.platform || 'Unknown',
      userAgent: navigator.userAgent,
    };
  }

  /**
   * Get stable device ID (persistent across sessions)
   */
  getCurrentDeviceStableId(): string {
    return this.getOrCreateStableId();
  }

  /**
   * Get browser location with user permission
   */
  async getBrowserLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
      
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
    } catch (error) {
      console.log('Location permission denied or unavailable:', error);
      return null;
    }
  }
}

export const deviceDetectionService = new DeviceDetectionService();

