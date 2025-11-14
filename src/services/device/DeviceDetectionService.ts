import { UAParser } from 'ua-parser-js';

interface DeviceFingerprint {
  deviceFingerprint: string;
  deviceStableId: string;
  deviceType: string;
  deviceBrand?: string;
  deviceModel?: string;
  deviceName: string;
  operatingSystem: string;
  osVersion: string;
  browserName: string;
  browserVersion: string;
  userAgent: string;
  screenResolution: string;
  platformType: string;
  hardwareCapabilities: {
    cores: number;
    memory?: number;
    touch: boolean;
    webgl: boolean;
    canvas: boolean;
  };
}

class DeviceDetectionService {
  private parser: any;

  constructor() {
    this.parser = new (UAParser as any)();
  }

  /**
   * Generate a stable device ID based on multiple factors
   */
  private async generateStableDeviceId(): Promise<string> {
    const factors: string[] = [];

    // User agent
    factors.push(navigator.userAgent);

    // Screen resolution
    factors.push(`${window.screen.width}x${window.screen.height}`);
    factors.push(`${window.screen.colorDepth}`);

    // Timezone
    factors.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

    // Platform
    factors.push(navigator.platform);

    // Hardware concurrency (CPU cores)
    if (navigator.hardwareConcurrency) {
      factors.push(`cores:${navigator.hardwareConcurrency}`);
    }

    // Language
    factors.push(navigator.language);

    // Canvas fingerprint
    const canvasFingerprint = await this.getCanvasFingerprint();
    if (canvasFingerprint) {
      factors.push(canvasFingerprint);
    }

    // WebGL fingerprint
    const webglFingerprint = this.getWebGLFingerprint();
    if (webglFingerprint) {
      factors.push(webglFingerprint);
    }

    // Create hash from all factors
    const combinedString = factors.join('|');
    const hash = await this.hashString(combinedString);
    
    return hash;
  }

  /**
   * Generate canvas fingerprint
   */
  private async getCanvasFingerprint(): Promise<string | null> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      canvas.width = 200;
      canvas.height = 50;

      // Draw text with specific styling
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Device Fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Canvas Test', 4, 17);

      // Get data URL and hash it
      const dataUrl = canvas.toDataURL();
      return await this.hashString(dataUrl);
    } catch (error) {
      console.warn('Canvas fingerprinting failed:', error);
      return null;
    }
  }

  /**
   * Generate WebGL fingerprint
   */
  private getWebGLFingerprint(): string | null {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return null;

      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return null;

      const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const vendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

      return `${vendor}|${renderer}`;
    } catch (error) {
      console.warn('WebGL fingerprinting failed:', error);
      return null;
    }
  }

  /**
   * Hash a string using SHA-256
   */
  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Detect hardware capabilities
   */
  private detectHardwareCapabilities() {
    return {
      cores: navigator.hardwareConcurrency || 1,
      memory: (navigator as any).deviceMemory || undefined,
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      webgl: !!document.createElement('canvas').getContext('webgl'),
      canvas: !!document.createElement('canvas').getContext('2d'),
    };
  }

  /**
   * Generate a comprehensive device fingerprint (changes more frequently)
   */
  private async generateDeviceFingerprint(): Promise<string> {
    const factors: string[] = [];

    // Current factors (can change)
    factors.push(navigator.userAgent);
    factors.push(`${window.screen.width}x${window.screen.height}`);
    factors.push(navigator.language);
    factors.push(new Date().toISOString().split('T')[0]); // Include date for daily rotation

    // Battery status (if available)
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        factors.push(`battery:${battery.charging}:${Math.round(battery.level * 100)}`);
      } catch (e) {
        // Battery API not available or blocked
      }
    }

    const combinedString = factors.join('|');
    return await this.hashString(combinedString);
  }

  /**
   * Get User-Agent Client Hints for more accurate OS info (Chromium only)
   */
  private async getUserAgentClientHints(): Promise<{ osName?: string; osVersion?: string; platform?: string } | null> {
    try {
      // Check if User-Agent Client Hints API is available
      if ('userAgentData' in navigator && (navigator as any).userAgentData?.getHighEntropyValues) {
        const hints = await (navigator as any).userAgentData.getHighEntropyValues([
          'platform',
          'platformVersion',
          'model',
          'uaFullVersion'
        ]);
        
        return {
          osName: hints.platform || undefined,
          osVersion: hints.platformVersion || undefined,
          platform: hints.platform || undefined,
        };
      }
    } catch (error) {
      console.warn('User-Agent Client Hints not available:', error);
    }
    return null;
  }

  /**
   * Detect device type more accurately
   */
  private detectDeviceType(result: any): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Check for mobile devices first
    if (result.device.type === 'mobile' || /mobile|android|iphone/i.test(navigator.userAgent)) {
      return 'mobile';
    }
    
    // Check for tablets
    if (result.device.type === 'tablet' || /ipad|tablet/i.test(navigator.userAgent)) {
      return 'tablet';
    }
    
    // For desktop-class devices, check for laptop indicators
    // Check for common laptop brands and models
    if (userAgent.includes('macbook') || 
        /laptop|notebook/i.test(userAgent) ||
        // Windows laptops often have specific model indicators
        /thinkpad|latitude|elitebook|pavilion|inspiron|aspire|zenbook|vivobook|swift|spectre/i.test(userAgent)) {
      return 'laptop';
    }
    
    // Check for battery API (laptops typically have batteries)
    // @ts-ignore - Battery API not in TypeScript types
    if ('getBattery' in navigator || 'battery' in navigator) {
      return 'laptop';
    }
    
    // If screen width suggests a laptop (typically 1280-1920 width)
    const screenWidth = window.screen.width;
    if (screenWidth >= 1280 && screenWidth <= 1920 && window.screen.height >= 720 && window.screen.height <= 1200) {
      return 'laptop';
    }
    
    // Default to desktop for all other desktop-class devices
    // This includes iMac, Mac Mini, Windows desktops, Linux desktops, etc.
    return 'desktop';
  }

  /**
   * Get complete device information with fingerprinting
   */
  async getDeviceInfo(): Promise<DeviceFingerprint> {
    const result = this.parser.getResult();

    // Try to get more accurate OS info from User-Agent Client Hints
    const clientHints = await this.getUserAgentClientHints();

    // Generate fingerprints
    const deviceStableId = await this.generateStableDeviceId();
    const deviceFingerprint = await this.generateDeviceFingerprint();

    // Detect device type accurately
    const deviceType = this.detectDeviceType(result);

    // Use client hints for more accurate OS info if available
    let osName = result.os.name || 'Unknown';
    let osVersion = result.os.version || 'Unknown';
    
    if (clientHints?.osName) {
      osName = clientHints.osName;
      if (clientHints.osVersion) {
        osVersion = clientHints.osVersion;
      }
    }

    // Generate device name
    const deviceName = this.generateDeviceName(result, deviceType, osName, osVersion);

    // Map platform type to allowed database values
    const platformType = this.mapPlatformType(result);

    return {
      deviceFingerprint,
      deviceStableId,
      deviceType,
      deviceBrand: result.device.vendor || undefined,
      deviceModel: result.device.model || undefined,
      deviceName,
      operatingSystem: osName,
      osVersion: osVersion,
      browserName: result.browser.name || 'Unknown',
      browserVersion: result.browser.version || 'Unknown',
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      platformType,
      hardwareCapabilities: this.detectHardwareCapabilities(),
    };
  }

  /**
   * Map platform to allowed database values: 'web', 'ios', 'android', 'pwa'
   */
  private mapPlatformType(result: any): string {
    const os = result.os.name?.toLowerCase() || '';
    
    // Check if running as PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone === true;
    
    if (isPWA) {
      return 'pwa';
    }
    
    // Map based on OS
    if (os.includes('ios') || os.includes('iphone') || os.includes('ipad')) {
      return 'ios';
    }
    
    if (os.includes('android')) {
      return 'android';
    }
    
    // Default to web for desktop/other platforms
    return 'web';
  }

  /**
   * Generate a friendly device name
   */
  private generateDeviceName(result: any, deviceType: string, osName?: string, osVersion?: string): string {
    const parts: string[] = [];

    // Add browser with version
    if (result.browser.name) {
      parts.push(result.browser.name);
      if (result.browser.version) {
        const majorVersion = result.browser.version.split('.')[0];
        parts.push(majorVersion);
      }
    }

    // Add OS with version (use provided values or fallback to parsed values)
    const finalOsName = osName || result.os.name;
    const finalOsVersion = osVersion || result.os.version;
    
    if (finalOsName) {
      parts.push(finalOsName);
      if (finalOsVersion && finalOsVersion !== 'Unknown') {
        // For macOS, show shorter version (e.g., "14.0" instead of "14.0.0")
        const versionParts = finalOsVersion.split('.');
        if (finalOsName.toLowerCase().includes('mac') && versionParts.length >= 2) {
          parts.push(`${versionParts[0]}.${versionParts[1]}`);
        } else {
          parts.push(finalOsVersion);
        }
      }
    }

    // Add device type
    if (deviceType) {
      parts.push(deviceType.charAt(0).toUpperCase() + deviceType.slice(1));
    }

    return parts.join(' ') || 'Unknown Device';
  }

  /**
   * Check if device fingerprint matches stored fingerprint
   */
  async validateFingerprint(storedFingerprint: string): Promise<boolean> {
    const currentFingerprint = await this.generateDeviceFingerprint();
    return currentFingerprint === storedFingerprint;
  }
}

export const deviceDetectionService = new DeviceDetectionService();
export type { DeviceFingerprint };
