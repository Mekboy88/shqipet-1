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
    
    // Priority 1: Check user agent for mobile/tablet keywords
    if (ua.includes('mobile') || ua.includes('android') && !ua.includes('tablet')) {
      return 'mobile';
    }
    
    if (ua.includes('ipad') || ua.includes('tablet') || (ua.includes('android') && !ua.includes('mobile'))) {
      return 'tablet';
    }
    
    // Priority 2: Use UA parser device type
    if (deviceType === 'mobile') return 'mobile';
    if (deviceType === 'tablet') return 'tablet';
    
    // Priority 3: Check for touch support + viewport size for physical device detection
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || window.screen.width;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || window.screen.height;
    const maxViewport = Math.max(viewportWidth, viewportHeight);

    // Special case: iPadOS can report as Mac with touch
    const isIpadLike = /mac os x/.test(ua) && (navigator.platform === 'MacIntel') && navigator.maxTouchPoints > 1;
    if (isIpadLike) {
      return 'tablet';
    }
    
    // Priority 4: Screen size-based detection with comprehensive ranges
    // Mobile: < 768px (smartphones in any orientation)
    if (viewportWidth < 768) {
      return 'mobile';
    }
    
    // Tablet: 768px - 1024px (tablets like iPad, Android tablets)
    if (viewportWidth >= 768 && viewportWidth < 1024) {
      return 'tablet';
    }
    
    // Laptop: 1024px - 1920px (laptops, including 1728x1117 and smaller notebooks)
    if (viewportWidth >= 1024 && viewportWidth < 1920) {
      return 'laptop';
    }
    
    // Desktop: >= 1920px (large monitors, 4K displays)
    return 'desktop';
  }

  /**
   * Get complete device information (privacy-compliant)
   */
  getDeviceInfo(): DeviceInfo {
    const result = UAParser(navigator.userAgent);
    const browser = result.browser;
    const os = result.os;
    const device = result.device;

    return {
      deviceId: crypto.randomUUID(), // Session-level random ID
      deviceStableId: this.getOrCreateStableId(),
      deviceType: this.detectDeviceType(),
      operatingSystem: `${os.name || 'Unknown'} ${os.version || ''}`.trim(),
      browserName: browser.name || 'Unknown Browser',
      browserVersion: browser.version || '',
      screenResolution: `${window.innerWidth || window.screen.width}x${window.innerHeight || window.screen.height}`,
      platform: navigator.platform || 'Unknown',
      userAgent: navigator.userAgent,
    };
  }

  /**
   * Get current device stable ID
   */
  getCurrentDeviceStableId(): string {
    return this.getOrCreateStableId();
  }

  /**
   * Get browser location (requires user permission)
   */
  async getBrowserLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Permission denied or error - return null
          resolve(null);
        }
      );
    });
  }
}

export const deviceDetectionService = new DeviceDetectionService();
