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
   * Generate or retrieve stable device ID based on hardware fingerprint
   * Privacy-compliant: uses browser-exposed characteristics, same device = same ID across domains
   */
  private async getOrCreateStableId(): Promise<string> {
    // Check cache first
    let stableId = localStorage.getItem(this.STORAGE_KEY);
    if (stableId) return stableId;

    // Use only stable, version-agnostic characteristics (avoid browser version/userAgent)
    const parser = new UAParser();
    const osName = (parser.getOS().name || 'UnknownOS');

    const fingerprintParts = {
      os: osName, // no version
      platform: navigator.platform || 'unknown',
      vendor: navigator.vendor || 'unknown',
      screen: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth || 0,
      pixelRatio: (window.devicePixelRatio || 1),
      hw: (navigator.hardwareConcurrency || 0),
      mem: (navigator as any).deviceMemory || 0,
      touch: navigator.maxTouchPoints || 0,
      tz: new Date().getTimezoneOffset(),
      lang: (navigator.languages && navigator.languages.join(',')) || navigator.language || 'en',
    };

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(fingerprintParts));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    stableId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);

    localStorage.setItem(this.STORAGE_KEY, stableId);
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
  async getDeviceInfo(): Promise<DeviceInfo> {
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
      deviceStableId: await this.getOrCreateStableId(),
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
  async getCurrentDeviceStableId(): Promise<string> {
    return await this.getOrCreateStableId();
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

