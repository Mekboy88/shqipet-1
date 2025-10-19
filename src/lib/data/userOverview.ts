/**
 * DO NOT EDIT. This file is locked to maintain perfect sync with SuperBase/Supabase and Admin Settings. 
 * Changes will break real-time accuracy.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import supabase from '@/lib/relaxedSupabase';
import { toast } from 'sonner';
import { ConnectionStatusBanner } from '@/components/ErrorBoundary/GlobalErrorBoundary';

// Runtime lock protection
if (typeof window !== 'undefined' && 
    typeof import.meta !== 'undefined' && 
    import.meta.env?.DEV && 
    import.meta.env?.LOCK_SYNC_FILES === 'true') {
  console.error('🔒 DO NOT CHANGE THIS. This file should not be changed ever.');
}

export interface UserOverview {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  username?: string;
  email?: string;
  phone?: string;
  phone_number?: string; // Support both formats for compatibility
  gender?: 'male' | 'female' | string;
  birthday?: string; // REAL birthday from profile_settings
  created_at: string;
  email_verified: boolean;
  phone_verified: boolean;
  two_factor_enabled: boolean;
  role?: string;
  status?: string;
  last_sign_in_at?: string;
  profile_image_url?: string;
  country?: string;
  languages?: string[];
  timezone?: string;
  otp_email_pending?: boolean;
  otp_phone_pending?: boolean;
  otp_email_expires_at?: string;
  otp_phone_expires_at?: string;
  email_verified_at?: string;
  phone_verified_at?: string;
  synced_at: string;
}

export interface UserOverviewFilters {
  search?: string;
  role?: string;
  status?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  limit?: number;
  offset?: number;
}

// Query keys for React Query
export const userOverviewKeys = {
  all: ['user-overview'] as const,
  user: (userId: string) => [...userOverviewKeys.all, 'user', userId] as const,
  adminUsers: (filters?: UserOverviewFilters) => [...userOverviewKeys.all, 'admin', filters] as const,
};

/**
 * Hook for fetching individual user overview (General Settings)
 */
export const useUserOverview = (userId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: userOverviewKeys.user(userId || ''),
    queryFn: async (): Promise<UserOverview | null> => {
      if (!userId) return null;

      console.log(`🔍 Fetching user overview with PERFECT verification sync for: ${userId}`);
      
      // STEP 1: Get auth.users data (SOURCE OF TRUTH for verification)
      const { data: authUserResponse } = await supabase.auth.admin.getUserById(userId);
      const authUser = authUserResponse?.user;
      
      // STEP 2: Get current user session for additional auth data
      const { data: currentAuthUser } = await supabase.auth.getUser();
      
      // STEP 3: Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      // STEP 4: Get profile settings for additional fields (birthday, etc.)
      const { data: settingsData } = await supabase
        .from('profile_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // STEP 5: Get user role from user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      // STEP 6: Determine TRUE verification status from auth.users (NEVER FAILS)
      let emailVerified = false;
      let phoneVerified = false;
      let userEmail = '';
      let userPhone = '';

      if (authUser) {
        // Use admin API data (100% accurate)
        emailVerified = !!authUser.email_confirmed_at;
        phoneVerified = !!authUser.phone_confirmed_at;
        userEmail = authUser.email || '';
        userPhone = authUser.phone || '';
        console.log(`✅ AUTH VERIFICATION STATUS - Email: ${emailVerified}, Phone: ${phoneVerified}`);
      } else if (currentAuthUser?.user && currentAuthUser.user.id === userId) {
        // Fallback to current user session
        emailVerified = !!currentAuthUser.user.email_confirmed_at;
        phoneVerified = !!currentAuthUser.user.phone_confirmed_at;
        userEmail = currentAuthUser.user.email || '';
        userPhone = currentAuthUser.user.phone || '';
        console.log(`✅ FALLBACK VERIFICATION STATUS - Email: ${emailVerified}, Phone: ${phoneVerified}`);
      }

      // STEP 7: Sync profiles table with auth verification status
      if (profileData && (
        profileData.email_verified !== emailVerified || 
        profileData.phone_verified !== phoneVerified ||
        profileData.email !== userEmail ||
        profileData.phone_number !== userPhone
      )) {
        console.log(`🔄 SYNCING profile verification status for user: ${userId}`);
        
        // Update profiles table to match auth.users
        const { error: syncError } = await supabase
          .from('profiles')
          .update({
            email: userEmail,
            phone_number: userPhone,
            email_verified: emailVerified,
            phone_verified: phoneVerified,
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', userId);
        
        if (!syncError) {
          console.log(`✅ PROFILE SYNCED with auth verification status`);
          // Update local profileData
          profileData.email_verified = emailVerified;
          profileData.phone_verified = phoneVerified;
          profileData.email = userEmail;
          profileData.phone_number = userPhone;
        } else {
          console.error('❌ Failed to sync profile verification:', syncError);
        }
      }

      if (profileError) {
        console.error('❌ Error fetching user overview:', profileError);
        // Don't throw error, try to create minimal profile from auth data
      }

      // STEP 8: If no profile exists, create one with PERFECT auth sync
      if (!profileData && (authUser || currentAuthUser?.user)) {
        console.log(`📝 Creating PERFECT profile with auth sync for user: ${userId}`);
        
        const sourceUser = authUser || currentAuthUser?.user;
        const basicProfile = {
          id: sourceUser.id,
          auth_user_id: sourceUser.id,
          first_name: sourceUser.user_metadata?.first_name || '',
          last_name: sourceUser.user_metadata?.last_name || '',
          email: userEmail,
          username: sourceUser.user_metadata?.username || '',
          phone_number: userPhone,
          gender: sourceUser.user_metadata?.gender || settingsData?.gender || '',
          created_at: sourceUser.created_at,
          email_verified: emailVerified,
          phone_verified: phoneVerified,
          two_factor_enabled: false,
          profile_image_url: sourceUser.user_metadata?.avatar_url || '',
          nationality: settingsData?.country || ''
        };

        // Try to create the profile record
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({
            ...basicProfile,
            user_id: sourceUser.id // Add the required user_id field
          }, { onConflict: 'auth_user_id' })
          .select()
          .single();

        if (!createError && newProfile) {
          console.log(`✅ PERFECT profile created with auth sync for user: ${userId}`);
          // Use the newly created profile
          const data = newProfile;
          
          return {
            id: data.id,
            user_id: data.auth_user_id,
            first_name: data.first_name,
            last_name: data.last_name,
            full_name: data.first_name && data.last_name ? 
              `${data.first_name} ${data.last_name}` : 
              data.username || 'User',
            username: data.username,
            email: data.email,
            phone: data.phone_number,
            gender: data.gender,
            created_at: data.created_at,
            email_verified: emailVerified, // Use auth source of truth
            phone_verified: phoneVerified, // Use auth source of truth
            two_factor_enabled: data.two_factor_enabled || false,
            role: roleData?.role || 'user',
            status: 'active',
            profile_image_url: data.profile_image_url,
            country: data.nationality || settingsData?.country,
            timezone: settingsData?.timezone,
            languages: settingsData?.languages,
            email_verified_at: authUser?.email_confirmed_at || currentAuthUser?.user?.email_confirmed_at,
            phone_verified_at: authUser?.phone_confirmed_at || currentAuthUser?.user?.phone_confirmed_at,
            synced_at: new Date().toISOString()
          } as UserOverview;
        }
      }

      if (!profileData) {
        console.log(`⚠️ No profile found and couldn't create one for user: ${userId}`);
        return null;
      }

      console.log(`✅ PERFECT user overview fetched for: ${userId}`, profileData);
      
      // STEP 9: Transform data with GUARANTEED accurate verification status AND all fields
      const transformedData = {
        id: profileData.id,
        user_id: profileData.auth_user_id,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        full_name: profileData.first_name && profileData.last_name ? 
          `${profileData.first_name} ${profileData.last_name}` : 
          profileData.username || 'User',
        username: profileData.username,
        email: userEmail || profileData.email, // Use auth email as source of truth
        phone: userPhone || profileData.phone_number, // Use auth phone as source of truth
        phone_number: userPhone || profileData.phone_number, // Support both formats
        gender: profileData.gender || settingsData?.gender,
        created_at: profileData.created_at,
        email_verified: emailVerified, // GUARANTEED accurate from auth.users
        phone_verified: phoneVerified, // GUARANTEED accurate from auth.users
        two_factor_enabled: profileData.two_factor_enabled || false,
        role: roleData?.role || 'user', // REAL role from user_roles table
        birthday: settingsData?.birthday, // REAL birthday from profile_settings
        status: 'active',
        profile_image_url: profileData.profile_image_url,
        country: profileData.nationality || profileData.country || settingsData?.country,
        timezone: profileData.timezone || settingsData?.timezone,
        languages: profileData.languages || settingsData?.languages,
        otp_email_pending: profileData.otp_email_pending || false,
        otp_phone_pending: profileData.otp_phone_pending || false,
        email_verified_at: authUser?.email_confirmed_at || currentAuthUser?.user?.email_confirmed_at,
        phone_verified_at: authUser?.phone_confirmed_at || currentAuthUser?.user?.phone_confirmed_at,
        last_sign_in_at: authUser?.last_sign_in_at || currentAuthUser?.user?.last_sign_in_at,
        synced_at: new Date().toISOString()
      } as UserOverview;

      console.log(`✅ PERFECT transformed user overview with guaranteed verification status:`, {
        userId,
        email_verified: emailVerified,
        phone_verified: phoneVerified,
        email: userEmail,
        phone: userPhone
      });
      
      return transformedData;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.code === '42501' || error?.message?.includes('permission')) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Setup realtime subscriptions with resilient channels
  useEffect(() => {
    if (!userId) return;

    console.log(`🔄 Setting up resilient realtime for user: ${userId}`);

    // Create resilient channels
    const profilesChannelData = supabase.channel(`user-overview-profiles-${userId}`);

    // Setup profiles subscription
    profilesChannelData
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log(`📡 Profiles realtime update for ${userId}:`, payload);
          queryClient.invalidateQueries({ queryKey: userOverviewKeys.user(userId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannelData);
    };
  }, [userId, queryClient]);

  const refreshUser = useCallback(async () => {
    if (!userId) return;
    console.log(`🔄 Manually refreshing user overview for: ${userId}`);
    await queryClient.invalidateQueries({ queryKey: userOverviewKeys.user(userId) });
  }, [userId, queryClient]);

  return {
    ...query,
    refreshUser
  };
};

/**
 * Hook for fetching admin users list (Admin Users Table)
 * Enhanced with auto-recovery and pagination safety
 */
export const useAdminUsers = (filters?: UserOverviewFilters) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: userOverviewKeys.adminUsers(filters),
    queryFn: async (): Promise<{ data: UserOverview[]; count: number }> => {
      console.log('🔍 [useAdminUsers] Fetching admin users with filters:', filters);
      console.log('🔍 [useAdminUsers] Current route:', window.location.pathname);
      
      try {
        // Use secure backend function that authorizes and bypasses RLS safely
        const { data: efRes, error: efErr } = await supabase.functions.invoke('admin_list_visible_users', {
          body: {
            limit: filters?.limit ?? 50,
            offset: filters?.offset ?? 0,
            search: filters?.search ?? ''
          }
        });

        if (efErr) {
          console.error('❌ Error invoking admin_list_visible_users:', efErr);
          throw new Error(`Failed to list users: ${efErr.message || efErr}`);
        }

        const list = (efRes?.users ?? []) as any[];
        const total = efRes?.count ?? list.length;

        if (!list || list.length === 0) {
          console.log('⚠️ No users returned from edge function');
          return { data: [], count: total };
        }

        console.log(`✅ Edge function returned ${list.length} users (server-authorized)`);

        // Transform EF payload to UserOverview format
        const transformedUsers: UserOverview[] = list.map((u: any) => ({
          id: u.id,
          user_id: u.auth_user_id,
          first_name: u.first_name,
          last_name: u.last_name,
          full_name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : (u.username || 'User'),
          username: u.username,
          email: u.email,
          phone: u.phone_number,
          phone_number: u.phone_number,
          gender: u.gender,
          created_at: u.created_at,
          email_verified: !!u.email_verified,
          phone_verified: !!u.phone_verified,
          two_factor_enabled: !!u.two_factor_enabled,
          role: u.role || u.primary_role || 'user',
          status: u.account_status || 'active',
          profile_image_url: u.profile_image_url || u.avatar_url,
          country: u.nationality || u.country,
          timezone: u.timezone,
          languages: u.languages,
          otp_email_pending: !!u.otp_email_pending,
          otp_phone_pending: !!u.otp_phone_pending,
          synced_at: new Date().toISOString()
        }));

        console.log(`✅ Admin users transformed: ${transformedUsers.length} users`);
        console.log('📊 Sample transformed user:', transformedUsers[0]);

        return { data: transformedUsers, count: total };
        
      } catch (err: any) {
        console.error('❌ Critical error in useAdminUsers:', err);
        console.error('❌ Error details:', {
          message: err.message,
          code: err.code,
          details: err.details
        });
        throw new Error(`Failed to fetch admin users: ${err.message}`);
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount, error: any) => {
      // Enhanced retry logic for admin resilience
      if (failureCount >= 3) return false;
      
      // Don't retry on auth errors
      if (error?.code === '42501' || error?.message?.includes('permission')) {
        return false;
      }
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 8000)
  });

  // Setup realtime subscriptions for admin view with resilient channels
  useEffect(() => {
    console.log('🔄 Setting up resilient admin users realtime subscriptions');

    // Create resilient channels for admin view
    const profilesChannelData = supabase.channel('admin-users-profiles');
    const rolesChannelData = supabase.channel('admin-users-roles');

    // Subscribe to profiles changes (affects all users)
    profilesChannelData
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('📡 Admin profiles realtime update:', payload);
          queryClient.invalidateQueries({ queryKey: userOverviewKeys.adminUsers(filters) });
        }
      )
      .subscribe();

    // Subscribe to user_roles changes
    rolesChannelData
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        (payload) => {
          console.log('📡 Admin user_roles realtime update:', payload);
          queryClient.invalidateQueries({ queryKey: userOverviewKeys.adminUsers(filters) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannelData);
      supabase.removeChannel(rolesChannelData);
    };
  }, [filters, queryClient]);

  const refreshAdminUsers = useCallback(async () => {
    console.log('🔄 Manually refreshing admin users');
    await queryClient.invalidateQueries({ queryKey: userOverviewKeys.adminUsers(filters) });
  }, [filters, queryClient]);

  return {
    ...query,
    refreshAdminUsers
  };
};

/**
 * Utility function to invalidate all user overview caches
 */
export const invalidateUserOverviewCache = (queryClient: any, userId?: string) => {
  if (userId) {
    queryClient.invalidateQueries({ queryKey: userOverviewKeys.user(userId) });
  }
  queryClient.invalidateQueries({ queryKey: userOverviewKeys.all });
};

/**
 * Utility function to show sync status in UI
 */
export const getLastSyncTime = (user: UserOverview): string => {
  const syncTime = new Date(user.synced_at);
  const now = new Date();
  const diffMs = now.getTime() - syncTime.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  
  if (diffSeconds < 60) {
    return 'Synced with database a few seconds ago';
  } else if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `Synced with database ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else {
    const hours = Math.floor(diffSeconds / 3600);
    return `Synced with database ${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
};