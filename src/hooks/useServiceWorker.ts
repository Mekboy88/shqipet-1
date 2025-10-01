// DO NOT EDIT — Location & Preferences core (map, offline, geolocation, privacy, sync).

import { useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';
import { useToast } from '@/hooks/use-toast';

export function useServiceWorker() {
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);

  // Service worker is disabled for faster development updates
  // No useEffect needed to avoid unnecessary re-renders

  return {
    isOfflineReady,
    needRefresh,
  };
}