import { UAParser } from 'ua-parser-js';

export type DeviceCategory = 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'unknown';

const mapOS = (name?: string, version?: string) => {
  const n = (name || '').toLowerCase();
  const v = version ? ` ${version.split('.')[0]}` : '';
  
  if (n.includes('ios')) return `iOS${v}`;
  if (n.includes('ipados')) return `iPadOS${v}`;
  if (n.includes('android')) return `Android${v}`;
  if (n.includes('windows')) return `Windows${v}`;
  if (n.includes('mac')) return `macOS${v}`;
  if (n.includes('linux')) return 'Linux';
  return 'Unknown OS';
};

const fromRules = (ua: string): DeviceCategory => {
  const u = ua.toLowerCase();
  
  // Priority 1: Mobile detection (MUST be first - most specific)
  if (/(iphone|ipod|android.+mobile|windows phone|blackberry|bb10)/i.test(u)) {
    console.log('📱 Mobile device detected via UA pattern');
    return 'mobile';
  }
  
  // Priority 2: iPad detection (iPadOS 13+ reports as Macintosh)
  const isMacintosh = /macintosh/i.test(ua);
  const maxTouchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0;
  if (isMacintosh && maxTouchPoints > 1) {
    console.log('🔍 iPad detected via Macintosh + touch points');
    return 'tablet';
  }
  
  // Priority 3: Other tablets
  if (/(ipad|tablet|kindle|silk|playbook|galaxy tab|android(?!.*mobile))/i.test(u)) {
    console.log('📲 Tablet detected via UA pattern');
    return 'tablet';
  }
  
  // Priority 4: Explicit laptop indicators (MacBook, notebook, laptop)
  if (/(macbook|notebook|laptop)/i.test(u)) {
    console.log('💻 Laptop explicitly detected via UA');
    return 'laptop';
  }
  
  // Priority 5: Explicit desktop indicators (iMac, Mac Pro, Mac Studio, Mac mini)
  if (/(imac|mac\s?pro|mac\s?studio|mac\s?mini)/i.test(u)) {
    console.log('🖥️ Desktop Mac explicitly detected via UA');
    return 'desktop';
  }
  
  // Priority 6: Windows/Linux - use heuristics later
  if (/(windows nt|linux x86_64)/i.test(u)) {
    // Return 'unknown' to trigger battery detection for Windows/Linux
    return 'unknown';
  }
  
  // Priority 7: Generic macOS without explicit model
  if (/mac os x|macintosh/i.test(u)) {
    // Return 'unknown' to trigger battery detection (could be laptop or desktop)
    return 'unknown';
  }
  
  return 'unknown';
};

const guessDesktopVsLaptop = async (): Promise<'desktop' | 'laptop'> => {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent.toLowerCase();
  const nav = navigator as any;
  
  console.log('🔍 Starting desktop/laptop heuristics for:', ua);
  
  // Priority 1: Explicit MacBook keyword = definitive laptop
  if (/macbook/i.test(ua)) {
    console.log('💻 MacBook explicitly detected - LAPTOP');
    return 'laptop';
  }
  
  // Priority 2: Explicit desktop Mac keywords = definitive desktop
  if (/(imac|mac\s?pro|mac\s?studio|mac\s?mini)/i.test(ua)) {
    console.log('🖥️ Desktop Mac explicitly detected - DESKTOP');
    return 'desktop';
  }
  
  // Priority 3: Battery API for Windows/Linux laptops
  if (nav.getBattery) {
    try {
      const battery = await nav.getBattery();
      if (battery && battery.charging !== undefined) {
        console.log('🔋 Battery API detected - LAPTOP');
        return 'laptop';
      } else {
        console.log('🔌 No battery detected - DESKTOP');
        return 'desktop';
      }
    } catch (e) {
      console.log('⚠️ Battery API blocked/unavailable');
    }
  }
  
  // Priority 4: For generic macOS (without explicit model), check screen size
  const isMac = /mac os x|macintosh/i.test(ua);
  if (isMac) {
    const w = window.screen?.width || 0;
    const h = window.screen?.height || 0;
    
    // MacBook typical resolutions: 1280-2880 width, 800-1800 height
    // iMac resolutions: 1920+ width (21.5"), 2560+ width (27"+), 5120 width (5K)
    if (w >= 2560 || h >= 1440) {
      console.log('🖥️ macOS with high resolution - likely iMac/Desktop');
      return 'desktop';
    } else {
      console.log('💻 macOS with standard resolution - likely MacBook/Laptop');
      return 'laptop';
    }
  }
  
  // Priority 5: Screen size heuristics for Windows/Linux
  const w = window.screen?.width || 0;
  const h = window.screen?.height || 0;
  
  console.log('📐 Screen heuristics:', {
    width: w,
    height: h,
    platform: navigator.platform
  });
  
  // Very high resolution (4K+) → Desktop
  if (w >= 3840 || h >= 2160) {
    console.log('🖥️ 4K+ display detected - DESKTOP');
    return 'desktop';
  }
  
  // Typical laptop resolution range
  if (w >= 1280 && w <= 1920 && h >= 720 && h <= 1200) {
    console.log('💻 Typical laptop resolution - LAPTOP');
    return 'laptop';
  }
  
  // Priority 6: Final fallback - DESKTOP (safest assumption)
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

  const osName = mapOS(res.os?.name, res.os?.version);
  const browserBase = res.browser?.name || 'Unknown Browser';
  const browserVersion = res.browser?.version ? ` ${res.browser.version.split('.')[0]}` : '';
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
    operatingSystem: osName,
  };
}
