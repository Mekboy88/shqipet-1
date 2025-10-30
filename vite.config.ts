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
          // Aggressive code splitting to reduce unused JavaScript
          manualChunks(id: string) {
            // Split large vendor libraries into separate chunks
            if (id.includes('node_modules')) {
              // Split React and related libraries
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              // Split Radix UI components
              if (id.includes('@radix-ui')) {
                return 'radix-vendor';
              }
              // Split Supabase
              if (id.includes('@supabase')) {
                return 'supabase-vendor';
              }
              // Split other large libraries
              if (id.includes('framer-motion')) {
                return 'framer-vendor';
              }
              if (id.includes('lucide-react')) {
                return 'icons-vendor';
              }
              // All other node_modules
              return 'vendor';
            }
            // Split page components for lazy loading
            if (id.includes('src/pages/')) {
              return 'pages';
            }
            // Split app components
            if (id.includes('src/components/apps/')) {
              return 'apps';
            }
            // Split contexts
            if (id.includes('src/contexts/')) {
              return 'contexts';
            }
          },
        },
      },
      cssCodeSplit: true, // Enable CSS code splitting
      // Disable sourcemaps in production to reduce bundle size
      sourcemap: false,
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 2000,
      // Enable minification for better tree-shaking
      minify: 'terser' as const,
      terserOptions: {
        compress: {
          drop_console: false,
          pure_funcs: ['console.log'],
        },
      },
    },
    optimizeDeps: {
      exclude: ["workbox-window"],
    },
  };
});