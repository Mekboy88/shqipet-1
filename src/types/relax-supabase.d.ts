declare module '@/integrations/supabase/client' {
  // Force all imports of the Supabase client to be untyped to avoid compile-time coupling to DB schema
  export const supabase: any;
}
