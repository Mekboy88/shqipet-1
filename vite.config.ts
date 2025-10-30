import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";


// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins: PluginOption[] = [react()];

  if (mode === "development") {
    try {
      const { componentTagger } = await import("lovable-tagger");
      plugins.push(componentTagger());
    } catch (err) {
      console.warn("[vite] lovable-tagger not available; skipping in development.");
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    build: {
      // Memory-efficient build settings
      rollupOptions: {
        output: {
          // Enable CSS code splitting to reduce unused CSS on initial load
          manualChunks(id: string) {
            // Split vendor CSS into separate chunks
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            // Split route-based components to enable lazy CSS loading
            if (id.includes('src/pages/')) {
              return 'routes';
            }
          },
        },
      },
      cssCodeSplit: true, // Enable CSS code splitting
      // Disable sourcemaps in development builds to save memory
      sourcemap: false,
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 2000,
    },
    optimizeDeps: {
      exclude: ["workbox-window"],
    },
  };
});