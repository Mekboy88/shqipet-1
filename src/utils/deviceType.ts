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
  
  // CRITICAL: iPad detection (iPadOS 13+ reports as Macintosh)
  // Must check BEFORE mobile/tablet patterns
  const isMacintosh = /macintosh/i.test(ua);
  const maxTouchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0;
  if (isMacintosh && maxTouchPoints > 1) {
    console.log('🔍 iPad detected via Macintosh + touch points');
    return 'tablet';
  }
  
  // Mobile devices (canonicalized to 'mobile')
  if (/(iphone|ipod|android.+mobile|windows phone)/i.test(u)) return 'mobile';
  
  // Tablets
  if (/(ipad|tablet|kindle|silk|playbook|galaxy tab|android(?!.*mobile))/i.test(u)) return 'tablet';
  
  // Explicit laptop indicators
  if (/(macbook|notebook|laptop)/.test(u)) return 'laptop';
  
  // Explicit desktop indicators - iMac, Mac Pro, Mac Studio, Mac mini
  if (/(imac|mac\s?pro|mac\s?studio|mac\s?mini)/.test(u)) return 'desktop';
  
  // Windows/Linux desktops (but NOT generic macOS - needs heuristics)
  if (/(windows nt|linux x86_64)/.test(u)) return 'desktop';
  
  // For generic macOS "macintosh", return 'unknown' to trigger heuristics
  return 'unknown';
};

const guessDesktopVsLaptop = async (): Promise<'desktop' | 'laptop'> => {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent.toLowerCase();
  const nav = navigator as any;
  
  console.log('🔍 Starting desktop/laptop detection for:', ua);
  
  // Priority 1: Explicit model detection from user agent (most reliable)
  if (/(macbook)/.test(ua)) {
    console.log('💻 MacBook explicitly detected - LAPTOP');
    return 'laptop';
  }
  
  if (/(imac|mac\s?pro|mac\s?studio|mac\s?mini)/.test(ua)) {
    console.log('🖥️ Desktop Mac explicitly detected - DESKTOP');
    return 'desktop';
  }
  
  // Priority 2: For macOS without explicit model, DEFAULT TO DESKTOP
  // (iMacs, Mac Studios, Mac Pros are more common and don't have batteries)
  const isMac = /mac os x|macintosh/.test(ua);
  if (isMac) {
    console.log('🍎 Generic macOS detected - defaulting to DESKTOP (iMac/Studio/Pro more common)');
    return 'desktop';
  }
  
  // Priority 3: For Windows/Linux - use Battery API if available
  if (nav.getBattery) {
    try {
      const battery = await nav.getBattery();
      if (battery && battery.charging !== undefined) {
        console.log('🔋 Battery API detected - LAPTOP');
        return 'laptop';
      } else {
        console.log('🔌 No battery API response - DESKTOP');
        return 'desktop';
      }
    } catch (e) {
      console.log('⚠️ Battery API blocked/unavailable');
    }
  }
  
  // Priority 4: Screen size and touch heuristics
  const w = window.screen?.width || 0;
  const h = window.screen?.height || 0;
  const touch = 'ontouchstart' in window || nav.maxTouchPoints > 0;
  
  console.log('📐 Screen heuristics:', {
    width: w,
    height: h,
    hasTouch: touch,
    platform: navigator.platform
  });
  
  // Very high resolution (4K+) → Desktop
  if (w >= 3840 || h >= 2160) {
    console.log('🖥️ 4K+ display detected - DESKTOP');
    return 'desktop';
  }
  
  // Small screen + touch → Laptop/tablet
  if (w <= 1440 && touch) {
    console.log('👆 Small screen + touch - LAPTOP');
    return 'laptop';
  }
  
  // Priority 5: Final fallback - DESKTOP (safest assumption)
  console.log('🖥️ No definitive indicators - defaulting to DESKTOP');
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

  // Special case: iPadOS 13+ (and later) often reports as "Macintosh" but has touch input
  const isMacLike = /macintosh|mac os x/i.test(ua);
  const maxTouchPoints = (navigator as any)?.maxTouchPoints || 0;
  const isIPadDesktopUA = isMacLike && maxTouchPoints > 1;

  if (res.device?.type === 'mobile' || hints?.mobile === true) {
    deviceType = 'mobile';
  } else if (res.device?.type === 'tablet' || isIPadDesktopUA) {
    deviceType = 'tablet';
    if (isIPadDesktopUA) {
      console.log('🧠 Heuristic: Detected iPad masquerading as macOS via touch points → tablet');
    }
  } else if (uaRuleType !== 'unknown') {
    deviceType = uaRuleType;
  } else {
    deviceType = await guessDesktopVsLaptop();
  }

  const osName = mapOS(res.os?.name);
  const osVersion = res.os?.version ? ` ${res.os.version.split('.')[0]}` : '';
  const browserBase = res.browser?.name || 'Unknown Browser';
  const browserVersion = res.browser?.version ? ` ${res.browser.version}` : '';
  const browserName = `${browserBase}${browserVersion}`.trim();

  // Generate descriptive device names
  let deviceName = 'Unknown Device';
  if (deviceType === 'mobile') {
    if (/iphone/i.test(ua)) deviceName = 'iPhone';
    else if (/android/i.test(ua)) deviceName = 'Android Phone';
    else deviceName = 'Mobile Phone';
  } else if (deviceType === 'tablet') {
    if (/ipad/i.test(ua) || isIPadDesktopUA) deviceName = 'iPad';
    else if (/android/i.test(ua)) deviceName = 'Android Tablet';
    else deviceName = 'Tablet';
  } else if (deviceType === 'laptop') {
    if (osName === 'macOS') deviceName = 'MacBook';
    else if (osName === 'Windows') deviceName = 'Windows Laptop';
    else deviceName = `${osName} Laptop`;
  } else if (deviceType === 'desktop') {
    if (/imac/i.test(ua)) deviceName = 'iMac';
    else if (/mac\s?pro/i.test(ua)) deviceName = 'Mac Pro';
    else if (/mac\s?studio/i.test(ua)) deviceName = 'Mac Studio';
    else if (/mac\s?mini/i.test(ua)) deviceName = 'Mac mini';
    else if (osName === 'macOS') deviceName = 'Mac Desktop';
    else if (osName === 'Windows') deviceName = 'Windows Desktop PC';
    else deviceName = `${osName} Desktop`;
  }

  console.log('✅ Final Detection Result:', {
    deviceType,
    deviceName,
    browser: browserName,
    operatingSystem: `${osName}${osVersion}`
  });

  return {
    deviceType,
    deviceName,
    browser: browserName,
    operatingSystem: `${osName}${osVersion}`,
  };
}
