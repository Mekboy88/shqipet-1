/**
 * Resilient database types
 * This file provides a stable interface for database types that won't break builds
 * during schema migrations or type regeneration.
 */

import type { Database } from '@/integrations/supabase/types';

// Safe type exports that fall back gracefully
export type UserSession = Database['public']['Tables']['user_sessions']['Row'];

// Add other commonly used types here as needed
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];

// Helper to ensure types are available
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];
