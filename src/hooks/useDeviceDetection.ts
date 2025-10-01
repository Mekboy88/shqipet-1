
import { useEffect, useState } from 'react';

export const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [deviceOS, setDeviceOS] = useState<'ios' | 'android' | 'other'>('other');
  const [isAndroid, setIsAndroid] = useState(false);
  
  useEffect(() => {
    // Detect OS
    const userAgent = navigator.userAgent.toLowerCase();
    setIsMobile(/iphone|ipad|ipod|android/.test(userAgent));
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceOS('ios');
    } else if (/android/.test(userAgent)) {
      setDeviceOS('android');
      setIsAndroid(true);
    }

    // Check if app is installed (simplified detection)
    const checkAppInstalled = () => {
      // This is a very basic check - in production you should use a more reliable method
      const hasAppParam = new URLSearchParams(window.location.search).get('fromApp') === 'true';
      setIsAppInstalled(hasAppParam);
    };
    checkAppInstalled();
  }, []);

  const handleAppButtonClick = () => {
    if (isAppInstalled) {
      // Open the app if installed
      window.location.href = deviceOS === 'ios' ? 'shqipet://' : 'intent://shqipet#Intent;scheme=shqipet;package=app.shqipet;end';
    } else {
      // Download the app if not installed
      if (deviceOS === 'ios') {
        window.location.href = 'https://apps.apple.com/app/shqipet/id123456789';
      } else if (deviceOS === 'android') {
        window.location.href = 'https://play.google.com/store/apps/details?id=app.shqipet';
      }
    }
  };
  
  const getButtonText = () => {
    if (isAppInstalled) {
      return 'Hape'; // "Open" in Albanian
    }
    return 'Shkarko'; // "Download" in Albanian
  };

  return {
    isMobile,
    isAppInstalled,
    deviceOS,
    isAndroid,
    handleAppButtonClick,
    getButtonText
  };
};
