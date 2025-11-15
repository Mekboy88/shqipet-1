/**
 * MediaService - Unified media resolution with racing and caching
 * Handles all Wasabi key-to-URL resolution across the app
 */

import { supabase } from '@/integrations/supabase/client';

interface MediaCache {
  url: string;
  type: 'presigned' | 'blob';
  expiresAt: number;
}

interface LastGoodUrl {
  url: string;
  timestamp: number;
}

// Global caches
const mediaCache = new Map<string, MediaCache>();
const lastGoodUrls = new Map<string, LastGoodUrl>();
const inflightRequests = new Map<string, Promise<string>>();

// Cache for 14 minutes (refresh at T-30s before expiry)
const CACHE_DURATION_MS = 14 * 60 * 1000;
const REFRESH_THRESHOLD_MS = 30 * 1000;

class MediaService {
  /**
   * Get display URL from Wasabi key - races presigned and proxy
   */
  async getUrl(key: string): Promise<string> {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key provided');
    }

    // If a full URL is provided (legacy records), use it directly and cache it
    if (/^https?:\/\//i.test(key)) {
      const cacheKey = this.getCacheKey(key);
      const cached = mediaCache.get(cacheKey);
      if (cached && this.isCacheValid(cached)) {
        return cached.url;
      }
      this.cacheUrl(cacheKey, key, 'presigned');
      lastGoodUrls.set(cacheKey, { url: key, timestamp: Date.now() });
      return key;
    }

    const cacheKey = this.getCacheKey(key);
    
    // Check cache first
    const cached = mediaCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached.url;
    }

    // Check if request is already in flight
    const existingRequest = inflightRequests.get(cacheKey);
    if (existingRequest) {
      return existingRequest;
    }

    // Start new resolution
    const resolutionPromise = this.resolveUrl(key, cacheKey);
    inflightRequests.set(cacheKey, resolutionPromise);

    try {
      const url = await resolutionPromise;
      return url;
    } finally {
      inflightRequests.delete(cacheKey);
    }
  }

  /**
   * Race presigned URL vs proxy blob for fastest display
   */
  private async resolveUrl(key: string, cacheKey: string): Promise<string> {
    // Prefer authenticated proxy blob (works with JWT-protected function); fallback to presigned
    try {
      const blobUrl = await this.getProxyBlob(key);
      this.cacheUrl(cacheKey, blobUrl, 'blob');
      lastGoodUrls.set(cacheKey, { url: blobUrl, timestamp: Date.now() });
      return blobUrl;
    } catch (e1) {
      console.warn('⚠️ Proxy blob failed, trying presigned URL for key:', key);
      try {
        const presigned = await this.getPresignedUrl(key);
        this.cacheUrl(cacheKey, presigned, 'presigned');
        lastGoodUrls.set(cacheKey, { url: presigned, timestamp: Date.now() });
        return presigned;
      } catch (e2) {
        console.error('❌ Both media URL sources failed for key:', key, { e1, e2 });
        // Notify UI that resolution failed (debug banners can listen)
        try { window.dispatchEvent(new CustomEvent('media-resolve-failed', { detail: { key, cacheKey } })); } catch {}
        // Try last in-memory good URL (within 24h)
        const lastGood = lastGoodUrls.get(cacheKey);
        if (lastGood && (Date.now() - lastGood.timestamp) < 24 * 60 * 60 * 1000) {
          console.log('🔄 Using last good URL for key:', key);
          return lastGood.url;
        }
        // Try persisted localStorage per-key cache as ultimate fallback
        try {
          const raw = localStorage.getItem(`media:last:${cacheKey}`);
          if (raw) {
            const j = JSON.parse(raw);
            if (typeof j?.url === 'string') {
              console.log('🟡 Using persisted media cache for key:', cacheKey);
              return j.url as string;
            }
          }
        } catch {}
        throw e2;
      }
    }
  }

  /**
   * Get presigned URL from Supabase function
   */
  private async getPresignedUrl(key: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('wasabi-get-url', {
      body: { key, expires: 900 }
    });

    const url = (data as any)?.url || (data as any)?.getUrl || (data as any)?.signedUrl;

    if (error || !url) {
      throw new Error(`Failed to get presigned URL: ${error?.message || (data && JSON.stringify(data))}`);
    }

    // If the function returned the protected proxy URL, fetch it with auth and return a blob URL
    if (typeof url === 'string' && url.includes('/functions/v1/wasabi-proxy')) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session for proxy fetch');

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        }
      });
      if (!response.ok) {
        const t = await response.text().catch(() => '');
        throw new Error(`Proxy URL fetch failed: ${response.status} ${t}`);
      }
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }

    return url as string;
  }

  /**
   * Get proxy blob URL from Supabase function
   */
  async getProxyBlob(key: string): Promise<string> {
    try {
      console.log(`📡 Attempting proxy blob fetch for key: ${key}`);
      
      // Get the user's session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session - user must be logged in to access media');
      }
      
      // Use direct fetch with query params instead of invoke for better reliability
      const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wasabi-proxy?key=${encodeURIComponent(key)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Proxy function error:`, errorText);
        throw new Error(`Proxy request failed: ${response.status} ${errorText}`);
      }

      // Create blob from response
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      console.log(`✅ Proxy blob created: ${blobUrl.substring(0, 50)}...`);
      return blobUrl;
      
    } catch (error) {
      console.error(`❌ Proxy blob failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Preload image to prevent flicker
   */
  async preloadImage(url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => {
        console.warn('⚠️ Image preload failed, proceeding without blocking');
        resolve();
      };
      img.src = url;
    });
  }

  /**
   * Check if cached URL is still valid
   */
  private isCacheValid(cached: MediaCache): boolean {
    const now = Date.now();
    const timeUntilExpiry = cached.expiresAt - now;
    
    // Refresh if less than 30 seconds until expiry
    return timeUntilExpiry > REFRESH_THRESHOLD_MS;
  }

  /**
   * Cache resolved URL
   */
  private cacheUrl(cacheKey: string, url: string, type: 'presigned' | 'blob'): void {
    mediaCache.set(cacheKey, {
      url,
      type,
      expiresAt: Date.now() + CACHE_DURATION_MS
    });
    // Persist last good per-key to localStorage for cross-refresh fallback
    try {
      localStorage.setItem(`media:last:${cacheKey}`, JSON.stringify({ url, type, ts: Date.now() }));
    } catch {}
  }

  /**
   * Generate cache key from Wasabi key
   */
  private getCacheKey(key: string): string {
    // Normalize key by removing common prefixes
    return key.replace(/^(undefined\/|shqipet\/)*/, '');
  }

  /**
   * Clear cache for specific key
   */
  clearCache(key: string): void {
    const cacheKey = this.getCacheKey(key);
    mediaCache.delete(cacheKey);
    lastGoodUrls.delete(cacheKey);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    mediaCache.clear();
    lastGoodUrls.clear();
  }
}

// Export singleton instance
export const mediaService = new MediaService();