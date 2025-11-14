import type { Database } from '@/integrations/supabase/types';

type UserSession = Database['public']['Tables']['user_sessions']['Row'];

type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop';

// Heuristic to correct display-only device type without mutating stored data
export function getDisplayDeviceType(session: UserSession): DeviceType {
  const stored = (session.device_type as DeviceType) || 'desktop';
  const ua = (session.user_agent || '').toLowerCase();
  const res = session.screen_resolution || '';
  const match = res.match(/(\d+)x(\d+)/);
  const w = match ? parseInt(match[1], 10) : undefined;
  const h = match ? parseInt(match[2], 10) : undefined;

  // Respect explicit non-desktop types
  if (stored === 'mobile' || stored === 'tablet') return stored;

  // Strong laptop indicators from UA
  if (/\blaptop\b|\bnotebook\b|macbook|thinkpad|elitebook|xps|surface laptop|chromebook|pixelbook|zenbook|vivobook/.test(ua)) {
    return 'laptop';
  }

  // macOS: "Macintosh" appears on both MacBook and iMac. Use resolution thresholds.
  if (/macintosh/.test(ua) && !/ipad/.test(ua)) {
    const dpr = (globalThis as any).devicePixelRatio || 1;
    if (w && h) {
      // Known iMac scaled CSS resolutions and large desktops
      const macDesktopScaled: Array<[number, number]> = [
        [2240, 1260], // iMac 24" default scaled
        [2048, 1152], // iMac 21.5" 4K scaled
        [2560, 1440], // iMac 27" scaled
      ];
      if (macDesktopScaled.some(([cw, ch]) => cw === w && ch === h)) return 'desktop';
      if (w >= 2560 || h >= 1440) return 'desktop';
      // Otherwise assume MacBook (high-DPI typical)
      if (dpr >= 2) return 'laptop';
      return 'laptop';
    }
    return 'laptop';
  }

  // For Windows/Linux where UA is ambiguous, only classify as laptop on common laptop resolutions
  if (w && h) {
    const commonLaptop = [
      [1366, 768], [1440, 900], [1536, 864], [1600, 900], [1680, 1050], [1920, 1080], [1920, 1200]
    ];
    if (commonLaptop.some(([cw, ch]) => cw === w && ch === h)) {
      // Prefer stored value unless it says desktop; then correct to laptop
      if (stored !== 'laptop') return 'laptop';
    }

    // Ultra-wide or very large monitors are desktops
    const aspect = w / h;
    if (aspect >= 2.0 || w >= 2560 || h >= 1440) return 'desktop';
  }

  // Fallback to stored type to avoid over-correction
  return stored;
}

export function getDisplayTitle(session: UserSession, deviceType: DeviceType) {
  const title = (session.device_name || '').trim();
  const typeLabel = deviceType.charAt(0).toUpperCase() + deviceType.slice(1);
  if (!title) return typeLabel;
  const alreadyHasType = /(desktop|laptop|mobile|tablet)/i.test(title);
  return alreadyHasType ? title : `${title.replace(/\s+/g, ' ').trim()} ${typeLabel}`;
}

export function getDisplayDeviceName(session: UserSession, deviceType: DeviceType) {
  const browser = session.browser_info || 'Browser';
  const bver = session.browser_version || '';
  const os = session.operating_system || 'OS';
  const osver = session.device_os_version || '';
  const typeLabel = deviceType.charAt(0).toUpperCase() + deviceType.slice(1);
  return `${browser} ${bver} ${os} ${osver} ${typeLabel}`.replace(/\s+/g, ' ').trim();
}
