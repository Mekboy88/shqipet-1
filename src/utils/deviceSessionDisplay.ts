import { Monitor, Smartphone, Tablet, Laptop } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type UserSession = Database['public']['Tables']['user_sessions']['Row'];

// Map device_type to icon component
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

// Map device_type to display label
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
