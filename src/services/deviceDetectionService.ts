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
    
    // Priority 3: Check for touch support + screen size for physical device detection
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const maxDimension = Math.max(screenWidth, screenHeight);
    
    // Mobile: Touch device with small screen
    if (hasTouch && maxDimension < 768) {
      return 'mobile';
    }
    
    // Tablet: Touch device with medium screen
    if (hasTouch && maxDimension >= 768 && maxDimension < 1024) {
      return 'tablet';
    }
    
    // Priority 4: Use screen size for desktop/laptop distinction
    if (screenWidth < 1440) return 'laptop';
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
      screenResolution: `${window.screen.width}x${window.screen.height}`,
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
