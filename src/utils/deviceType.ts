import { UAParser } from 'ua-parser-js';

export type DeviceCategory = 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'unknown';

const mapOS = (name?: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('ios')) return 'iOS';
  if (n.includes('android')) return 'Android';
  if (n.includes('windows')) return 'Windows';
  if (n.includes('mac')) return 'macOS';
  if (n.includes('linux')) return 'Linux';
  return 'Unknown OS';
};

const fromRules = (ua: string): DeviceCategory => {
  const u = ua.toLowerCase();
  
  // Mobile devices
  if (/(iphone|android mobile|windows phone)/.test(u)) return 'mobile';
  
  // Tablets
  if (/(ipad|tablet|kindle|silk|playbook|galaxy tab)/.test(u)) return 'tablet';
  
  // Explicit laptop indicators
  if (/(macbook|notebook|laptop)/.test(u)) return 'laptop';
  
  // Windows/Linux desktops (but NOT macOS - needs heuristics)
  if (/(windows nt|linux x86_64)/.test(u)) return 'desktop';
  
  // For macOS "macintosh", return 'unknown' to trigger heuristics
  return 'unknown';
};

const guessDesktopVsLaptop = async (): Promise<'desktop' | 'laptop'> => {
  if (typeof window === 'undefined') return 'desktop';
  
  const nav = navigator as any;
  
  // Check battery API (most reliable indicator of laptop vs desktop)
  if (nav.getBattery) {
    try {
      const battery = await nav.getBattery();
      // If device reports battery, it's likely a laptop
      if (battery && battery.charging !== undefined) {
        console.log('🔋 Battery API detected - classifying as laptop');
        return 'laptop';
      }
    } catch (e) {
      console.log('⚠️ Battery API not available or blocked');
    }
  }
  
  // Screen size and touch heuristics
  const w = window.screen?.width || 0;
  const h = window.screen?.height || 0;
  const touch = 'ontouchstart' in window || nav.maxTouchPoints > 0;
  
  console.log('🔍 Device Detection Heuristics:', {
    screenWidth: w,
    screenHeight: h,
    hasTouch: touch,
    batteryAPI: !!nav.getBattery
  });
  
  // Laptops: smaller screens (≤1920px) or touch-enabled
  // Desktops: large screens (>1920px, especially 4K/5K displays)
  if (w <= 1920 || h <= 1200 || touch) return 'laptop';
  
  return 'desktop';
};

export async function detectFromUserAgent(
  ua: string,
  hints?: { platform?: string; model?: string; mobile?: boolean }
): Promise<{ deviceType: DeviceCategory; deviceName: string; browser: string; operatingSystem: string }> {
  const parser = new UAParser(ua);
  const res = parser.getResult();

  console.log('🔍 Device Detection Debug:', {
    userAgent: ua,
    uaParserDevice: res.device?.type,
    uaParserOS: res.os?.name,
    uaParserBrowser: res.browser?.name,
    screenSize: `${screen?.width}x${screen?.height}`,
    platform: hints?.platform || navigator?.platform
  });

  let deviceType: DeviceCategory = 'unknown';
  const uaRuleType = fromRules(ua);

  if (res.device?.type === 'mobile' || hints?.mobile === true) deviceType = 'mobile';
  else if (res.device?.type === 'tablet') deviceType = 'tablet';
  else if (uaRuleType !== 'unknown') deviceType = uaRuleType;
  else deviceType = await guessDesktopVsLaptop();

  const osName = mapOS(res.os?.name);
  const browserName = res.browser?.name || 'Unknown Browser';

  let deviceName = 'Unknown Device';
  if (deviceType === 'mobile') {
    if (/iphone/i.test(ua)) deviceName = 'iPhone';
    else if (/android/i.test(ua)) deviceName = 'Android Phone';
    else deviceName = 'Mobile Device';
  } else if (deviceType === 'tablet') {
    if (/ipad/i.test(ua)) deviceName = 'iPad';
    else deviceName = 'Android Tablet';
  } else if (deviceType === 'laptop') {
    deviceName = osName === 'macOS' ? 'MacBook' : `${osName} Laptop`;
  } else if (deviceType === 'desktop') {
    deviceName = osName === 'macOS' ? 'Mac' : `${osName} PC`;
  }

  console.log('✅ Final Detection Result:', {
    deviceType,
    deviceName,
    browser: browserName,
    operatingSystem: osName
  });

  return {
    deviceType,
    deviceName,
    browser: browserName,
    operatingSystem: osName,
  };
}
