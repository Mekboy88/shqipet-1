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
    
    // Mobile: Touch device or narrow viewport
    if ((hasTouch && maxViewport < 768) || viewportWidth < 640) {
      return 'mobile';
    }
    
    // Tablet: Touch device with medium viewport or typical tablet width
    if ((hasTouch && maxViewport >= 768 && maxViewport < 1024) || (viewportWidth >= 640 && viewportWidth < 1024)) {
      return 'tablet';
    }
    
    // Priority 4: Use viewport width for desktop/laptop distinction
    if (viewportWidth < 1440) return 'laptop';
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
