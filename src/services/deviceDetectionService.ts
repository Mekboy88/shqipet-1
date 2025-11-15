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
   * Detect device type based on viewport size and user agent
   */
  private detectDeviceType(): 'mobile' | 'tablet' | 'laptop' | 'desktop' {
    const width = window.innerWidth; // Use viewport width, not screen width
    const result = UAParser(navigator.userAgent);
    const deviceType = result.device?.type;

    // Priority 1: Use UA parser if reliable
    if (deviceType === 'mobile') return 'mobile';
    if (deviceType === 'tablet') return 'tablet';

    // Priority 2: Use viewport width for responsive detection
    if (width < 768) return 'mobile';
    if (width >= 768 && width < 1024) return 'tablet';
    if (width >= 1024 && width < 1440) return 'laptop';
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
