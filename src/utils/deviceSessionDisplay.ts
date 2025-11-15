import { Monitor, Smartphone, Tablet, Laptop, Chrome, Globe } from 'lucide-react';
import type { UserSession } from '@/types/database';

/**
 * Map browser name to appropriate icon
 */
export const getBrowserIcon = (browserName: string | null) => {
  if (!browserName) return Globe;
  
  const browser = browserName.toLowerCase();
  
  // Chrome, Edge, Brave all use Chrome icon
  if (browser.includes('chrome') || browser.includes('edge') || browser.includes('brave')) {
    return Chrome;
  }
  
  // Default to Globe for other browsers
  return Globe;
};

/**
 * Map device_type to icon component based on screen size detection
 * 
 * Screen size ranges:
 * - Mobile (< 768px): Smartphone icon
 * - Tablet (768px - 1024px): Tablet icon
 * - Laptop (1024px - 1920px): Laptop icon
 * - Desktop (>= 1920px): Monitor icon
 */
export const getDeviceIcon = (deviceType: string | null) => {
  switch (deviceType) {
    case 'mobile':
      return Smartphone;
    case 'tablet':
      return Tablet;
    case 'laptop':
      return Laptop;
    case 'desktop':
    default:
      return Monitor;
  }
};

/**
 * Map device_type to display label with screen size context
 * 
 * Labels match the comprehensive screen size ranges:
 * - Mobile: < 768px (320px - 768px range)
 * - Tablet: 768px - 1024px
 * - Laptop: 1024px - 1920px (includes 1728x1117)
 * - Desktop: >= 1920px (Full HD and above)
 */
export const getDeviceLabel = (deviceType: string | null): string => {
  switch (deviceType) {
    case 'mobile':
      return 'Mobile';
    case 'tablet':
      return 'Tablet';
    case 'laptop':
      return 'Laptop';
    case 'desktop':
      return 'Desktop';
    default:
      return 'Desktop';
  }
};

export const deriveTitle = (browserName: string | null, operatingSystem: string | null, deviceType: string | null): string => {
  const browser = browserName || 'Unknown Browser';
  const os = operatingSystem || 'Unknown OS';
  const type = getDeviceLabel(deviceType);
  
  return `${browser} on ${os} • ${type}`;
};
