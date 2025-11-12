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
  if (/(iphone|android mobile|windows phone)/.test(u)) return 'mobile';
  if (/(ipad|tablet|kindle|silk|playbook|galaxy tab)/.test(u)) return 'tablet';
  if (/(macbook|notebook|laptop)/.test(u)) return 'laptop';
  if (/(windows nt|macintosh|linux x86_64)/.test(u)) return 'desktop';
  return 'unknown';
};

const guessDesktopVsLaptop = (): 'desktop' | 'laptop' => {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.screen?.width || 0;
  const h = window.screen?.height || 0;
  const touch = 'ontouchstart' in window || (navigator as any).maxTouchPoints > 0;
  // Heuristic: smaller screens or touch-enabled likely laptops; very large 4k likely desktop
  if (w <= 1680 || h <= 1050 || touch) return 'laptop';
  return 'desktop';
};

export function detectFromUserAgent(
  ua: string,
  hints?: { platform?: string; model?: string; mobile?: boolean }
): { deviceType: DeviceCategory; deviceName: string; browser: string; operatingSystem: string } {
  const parser = new UAParser(ua);
  const res = parser.getResult();

  let deviceType: DeviceCategory = 'unknown';
  const uaRuleType = fromRules(ua);

  if (res.device?.type === 'mobile' || hints?.mobile === true) deviceType = 'mobile';
  else if (res.device?.type === 'tablet') deviceType = 'tablet';
  else if (uaRuleType !== 'unknown') deviceType = uaRuleType;
  else deviceType = guessDesktopVsLaptop();

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

  return {
    deviceType,
    deviceName,
    browser: browserName,
    operatingSystem: osName,
  };
}
