/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_SUPABASE_PROJECT_ID: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_MAPBOX_PUBLIC_TOKEN?: string
  readonly VITE_ADMIN_DEFAULT_PAGE_SIZE?: string
  readonly LOCK_SYNC_FILES?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
