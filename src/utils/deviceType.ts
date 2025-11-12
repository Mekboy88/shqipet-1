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
  
  // Explicit desktop indicators - iMac, Mac Pro, Mac Studio, Mac mini
  if (/(imac|mac\s?pro|mac\s?studio|mac\s?mini)/.test(u)) return 'desktop';
  
  // Windows/Linux desktops (but NOT macOS - needs heuristics)
  if (/(windows nt|linux x86_64)/.test(u)) return 'desktop';
  
  // For macOS "macintosh", return 'unknown' to trigger heuristics
  return 'unknown';
};

const guessDesktopVsLaptop = async (): Promise<'desktop' | 'laptop'> => {
  if (typeof window === 'undefined') return 'desktop';
  
  const nav = navigator as any;
  const ua = navigator.userAgent.toLowerCase();
  
  // Check for explicit desktop Mac models in user agent
  if (/(imac|mac\s?pro|mac\s?studio|mac\s?mini)/.test(ua)) {
    console.log('🖥️ Desktop Mac detected from user agent');
    return 'desktop';
  }
  
  // Check for explicit laptop Mac models in user agent
  if (/(macbook)/.test(ua)) {
    console.log('💻 MacBook detected from user agent');
    return 'laptop';
  }
  
  // Check battery API (reliable indicator of laptop vs desktop)
  if (nav.getBattery) {
    try {
      const battery = await nav.getBattery();
      // If device reports battery, it's a laptop
      if (battery && battery.charging !== undefined) {
        console.log('🔋 Battery API detected - classifying as laptop');
        return 'laptop';
      } else {
        console.log('🔌 No battery detected - classifying as desktop');
        return 'desktop';
      }
    } catch (e) {
      console.log('⚠️ Battery API not available or blocked');
    }
  }
  
  // Screen size heuristics - use more aggressive desktop detection
  const w = window.screen?.width || 0;
  const h = window.screen?.height || 0;
  const touch = 'ontouchstart' in window || nav.maxTouchPoints > 0;
  
  console.log('🔍 Device Detection Heuristics:', {
    screenWidth: w,
    screenHeight: h,
    hasTouch: touch,
    batteryAPI: !!nav.getBattery,
    userAgent: ua
  });
  
  // High-resolution displays (4K, 5K, 6K) are almost always desktops
  if (w >= 3840 || h >= 2160) {
    console.log('🖥️ High-res display detected - classifying as desktop');
    return 'desktop';
  }
  
  // Touch-enabled is likely laptop/tablet
  if (touch) {
    console.log('👆 Touch detected - classifying as laptop');
    return 'laptop';
  }
  
  // For macOS without battery API, assume desktop (iMacs don't have battery)
  if (/mac os x|macintosh/.test(ua)) {
    console.log('🍎 macOS without battery - classifying as desktop');
    return 'desktop';
  }
  
  // Standard screens - default to desktop if no battery detected
  console.log('🖥️ No battery API, standard screen - classifying as desktop');
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
