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
   * Universal device detection based on viewport width
   * 
   * MOBILE: width < 768px
   * TABLET: 768px ≤ width < 1024px
   * LAPTOP: 1024px ≤ width < 1920px
   * DESKTOP: width ≥ 1920px
   */
  private detectDeviceType(): 'mobile' | 'tablet' | 'laptop' | 'desktop' {
    const viewportWidth = window.innerWidth;
    
    console.log('🔍 Device Detection:', {
      viewportWidth,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      userAgent: navigator.userAgent
    });
    
    // Universal detection rules
    if (viewportWidth < 768) {
      console.log('✅ Detected: mobile (width < 768px)');
      return 'mobile';
    }
    if (viewportWidth < 1024) {
      console.log('✅ Detected: tablet (768px ≤ width < 1024px)');
      return 'tablet';
    }
    if (viewportWidth < 1920) {
      console.log('✅ Detected: laptop (1024px ≤ width < 1920px)');
      return 'laptop';
    }
    
    console.log('✅ Detected: desktop (width ≥ 1920px)');
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

