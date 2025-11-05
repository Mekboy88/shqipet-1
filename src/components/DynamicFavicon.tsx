import { useEffect } from 'react';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';

/**
 * Component that dynamically updates the favicon based on app settings
 */
export const DynamicFavicon = () => {
  const { data: settings } = useWebsiteSettings();
  
  useEffect(() => {
    if (settings?.favicon_url) {
      // Remove quotes if they exist in the stored value
      const faviconUrl = typeof settings.favicon_url === 'string' 
        ? settings.favicon_url.replace(/['"]/g, '')
        : settings.favicon_url;
      
      // Update all favicon link elements
      const updateFavicon = (selector: string, url: string) => {
        const link = document.querySelector(selector) as HTMLLinkElement;
        if (link) {
          link.href = url;
        }
      };
      
      // Update various favicon formats
      updateFavicon('link[rel="icon"]', faviconUrl);
      updateFavicon('link[rel="shortcut icon"]', faviconUrl);
      updateFavicon('link[rel="apple-touch-icon"]', faviconUrl);
      updateFavicon('link[sizes="16x16"]', faviconUrl);
      updateFavicon('link[sizes="32x32"]', faviconUrl);
      updateFavicon('link[sizes="180x180"]', faviconUrl);
      
      console.log('✅ Favicon updated to:', faviconUrl);
    }
  }, [settings?.favicon_url]);
  
  return null;
};
