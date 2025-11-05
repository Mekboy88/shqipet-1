import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { GlobalRecoverBoundary } from './components/errors/GlobalRecoverBoundary';
import { LanguageProvider } from './contexts/LanguageContext'; 
import ViewSwitcher from './components/ViewSwitcher';
import { HelmetProvider } from 'react-helmet-async';
import { GlobalSkeleton } from '@/components/ui/GlobalSkeleton';
import './index.css';

// Global error listeners to catch JavaScript errors  
const CHUNK_ERROR_PATTERNS = [
  'ChunkLoadError',
  'Loading chunk',
  'Failed to fetch dynamically imported module',
  'Importing a module script failed'
];

const tryAutoRecover = (msg: unknown) => {
  const message = typeof msg === 'string' ? msg : (msg as any)?.message || String(msg ?? '');
  const isChunkError = CHUNK_ERROR_PATTERNS.some(p => message.includes(p));
  const alreadyReloaded = sessionStorage.getItem('chunkReloaded') === '1';

  if (!isChunkError) return;

  // First attempt: reload with cache-busting query to avoid stale chunks
  if (!alreadyReloaded) {
    console.warn('🔁 Auto-recover: chunk load error detected, reloading with cache-buster');
    sessionStorage.setItem('chunkReloaded', '1');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('v', Date.now().toString());
      // Preserve hash for hash routing
      const newHref = url.toString();
      window.location.replace(newHref);
    } catch {
      window.location.reload();
    }
    return;
  }

  // Second attempt: hard reload to fully reset runtime if error persists
  console.warn('🔁 Auto-recover: second attempt hard reload');
  sessionStorage.removeItem('chunkReloaded');
  window.location.reload();
};

window.addEventListener('error', (event) => {
  console.error('🚨 Global JavaScript Error:', event.error);
  console.error('🚨 Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
  tryAutoRecover(event.message || event.error?.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', event.reason);
  tryAutoRecover((event.reason as any)?.message || event.reason);
});

// Get root element
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Create root and render
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <HelmetProvider>
      <GlobalRecoverBoundary>
        <LanguageProvider>
          <Suspense fallback={<GlobalSkeleton />}>
            <ViewSwitcher />
          </Suspense>
        </LanguageProvider>
      </GlobalRecoverBoundary>
    </HelmetProvider>
  </StrictMode>
);
// Types for failsafe flag
declare global { interface Window { __APP_MOUNTED__?: boolean } }
// ✅ Tell failsafe that app mounted
window.__APP_MOUNTED__ = true;

const signalAppMounted = () => {
  window.dispatchEvent(new Event("app:mounted"));
};

signalAppMounted();
requestAnimationFrame(signalAppMounted);
setTimeout(signalAppMounted, 0);
setTimeout(signalAppMounted, 100);
