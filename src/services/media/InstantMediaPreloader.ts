/**
 * InstantMediaPreloader - Aggressively preloads all user media on login
 * Ensures zero delays when displaying avatar and cover photos
 */

class InstantMediaPreloader {
  private preloadedUsers = new Set<string>();
  
  /**
   * Preload all media for a user instantly on login
   */
  async preloadUserMedia(userId: string): Promise<void> {
    if (this.preloadedUsers.has(userId)) {
      return; // Already preloaded
    }
    
    console.log('⚡ InstantMediaPreloader: Starting aggressive preload for', userId);
    
    // Mark as in progress immediately
    this.preloadedUsers.add(userId);
    
    // Preload avatar from cache
    this.preloadFromCache(`avatar_cache_${userId}`);
    
    // Preload cover from cache
    this.preloadFromCache(`cover:last:${userId}`);
    
    console.log('✅ InstantMediaPreloader: Media preload initiated');
  }
  
  /**
   * Preload image from localStorage cache
   */
  private preloadFromCache(cacheKey: string): void {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return;
      
      const data = JSON.parse(cached);
      const url = data?.url || data?.lastGoodUrl;
      
      if (!url || !url.startsWith('http')) return;
      
      // Aggressive preload - don't wait for result
      const img = new Image();
      img.src = url;
      
      console.log('🎯 Preloading from cache:', url.substring(0, 80));
    } catch (e) {
      // Silent fail - preload is best-effort
    }
  }
  
  /**
   * Clear preload tracking for user (for testing)
   */
  clearPreloadTracking(userId: string): void {
    this.preloadedUsers.delete(userId);
  }
}

export const instantMediaPreloader = new InstantMediaPreloader();

// Expose for debugging
if (typeof window !== 'undefined') {
  (window as any).__instantMediaPreloader = instantMediaPreloader;
}
