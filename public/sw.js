// DEVELOPMENT SERVICE WORKER - DISABLED FOR INSTANT UPDATES
// This prevents caching during development for instant preview updates

console.log('🔧 Development Service Worker: Caching disabled for instant updates');

// Disable all caching during development
self.addEventListener('fetch', (event) => {
  // Skip service worker for all requests during development
  // This ensures instant updates and hot module replacement works
  return;
});

// Clear all existing caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🧹 Clearing cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('✅ All caches cleared for development');
      // Take control immediately
      return self.clients.claim();
    })
  );
});

// Skip waiting to activate immediately
self.addEventListener('install', (event) => {
  console.log('🔧 Development SW installed - skipping waiting');
  self.skipWaiting();
});

// Notify clients about updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});