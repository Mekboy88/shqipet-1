import { supabase } from '@/integrations/supabase/client';
import { deviceAuthService } from '@/services/deviceAuthService';

class ImmediateLogoutService {
  private static instance: ImmediateLogoutService;
  private logoutInProgress = false;

  static getInstance(): ImmediateLogoutService {
    if (!ImmediateLogoutService.instance) {
      ImmediateLogoutService.instance = new ImmediateLogoutService();
    }
    return ImmediateLogoutService.instance;
  }

  // Immediate, synchronous logout without delays
  async performImmediateLogout(isAdminLogout = false): Promise<void> {
    if (this.logoutInProgress) {
      console.log('⏳ Logout already in progress, skipping...');
      return;
    }

    this.logoutInProgress = true;
    console.log('🚪 Starting immediate logout process...');
    
    try {
      // Clear device auth state immediately
      deviceAuthService.clearDeviceAuthState();
      console.log('✅ Device auth state cleared');
      
      // Sign out from Supabase (this will trigger the auth state change)
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.error('❌ Supabase signOut error:', error);
      } else {
        console.log('✅ Supabase session cleared');
      }
      
      // Clear session storage immediately
      sessionStorage.clear();
      console.log('✅ Session storage cleared');
      
      // SECURITY FIX: Clear ALL auth-related data including last profile
      // Remove 'shqipet_last_profile' from keep list to prevent data leakage
      const keysToKeep = ['theme', 'language'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      console.log('✅ Auth-related localStorage cleared');
      
      console.log('✅ Immediate logout completed successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      this.logoutInProgress = false;
    }
  }

  // Admin-only logout
  async performAdminOnlyLogout(): Promise<void> {
    if (this.logoutInProgress) {
      return;
    }

    this.logoutInProgress = true;
    console.log('🔧 Starting admin-only logout...');
    
    try {
      // SECURITY FIX: Clear ALL storage on admin logout for maximum security
      // Remove all potential admin-related data from both storage types
      localStorage.clear();
      sessionStorage.clear();
      console.log('🔒 All client storage cleared for admin security');
      
      console.log('✅ Admin logout completed - redirecting to admin login');
      
      // Redirect to admin login page
      window.location.replace('/admin/login');
      
    } catch (error) {
      console.error('❌ Admin logout error:', error);
      // Force redirect even on error
      window.location.replace('/admin/login');
    } finally {
      this.logoutInProgress = false;
    }
  }
  
  isLogoutInProgress(): boolean {
    return this.logoutInProgress;
  }
}

export const immediateLogoutService = ImmediateLogoutService.getInstance();
