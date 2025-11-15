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

// Normalize the device title to match the actual device_type
export const deriveTitle = (deviceName: string | null, deviceType: string | null): string => {
  const correctLabel = getDeviceLabel(deviceType);
  const name = deviceName || 'Unknown Device';
  
  // Device words to check for mismatch
  const deviceWords = ['Desktop', 'Laptop', 'Mobile', 'Tablet', 'Smartphone'];
  
  // Check if name contains any device word
  let hasDeviceWord = false;
  let normalizedName = name;
  
  for (const word of deviceWords) {
    if (name.includes(word)) {
      hasDeviceWord = true;
      // Replace with correct label if it's wrong
      if (word.toLowerCase() !== correctLabel.toLowerCase()) {
        normalizedName = name.replace(new RegExp(word, 'gi'), correctLabel);
      }
      break;
    }
  }
  
  // If no device word found, append the type
  if (!hasDeviceWord) {
    normalizedName = `${name} • ${correctLabel}`;
  }
  
  return normalizedName;
};
