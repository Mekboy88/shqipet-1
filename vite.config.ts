import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Memory-efficient build settings
    rollupOptions: {
      output: {
        manualChunks: undefined, // Let Vite handle chunking automatically
      }
    },
    // Disable sourcemaps in development builds to save memory
    sourcemap: false,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 2000
  },
  optimizeDeps: {
    exclude: ['workbox-window']
  }
}));