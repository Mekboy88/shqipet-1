
import { supabase } from '@/integrations/supabase/client';
import { authLogger } from './authLogger';
import { immediateLogoutService } from './immediateLogoutService';

interface LogoutOptions {
  isAdminLogout?: boolean;
  forceReload?: boolean;
}

class LogoutService {
  private static instance: LogoutService;
  private logoutInProgress = false;

  static getInstance(): LogoutService {
    if (!LogoutService.instance) {
      LogoutService.instance = new LogoutService();
    }
    return LogoutService.instance;
  }

  // DEPRECATED: Use immediateLogoutService instead
  async performAdminOnlyLogout(): Promise<void> {
    console.warn('⚠️ DEPRECATED: Use immediateLogoutService.performAdminOnlyLogout() instead');
    return immediateLogoutService.performAdminOnlyLogout();
  }

  // DEPRECATED: Use immediateLogoutService instead
  async performCompleteLogout(options: LogoutOptions = {}): Promise<void> {
    console.warn('⚠️ DEPRECATED: Use immediateLogoutService.performImmediateLogout() instead');
    const { isAdminLogout = false } = options;
    return immediateLogoutService.performImmediateLogout(isAdminLogout);
  }

  // DEPRECATED: Use immediateLogoutService instead
  async performFastCompleteLogout(options: LogoutOptions = {}): Promise<void> {
    console.warn('⚠️ DEPRECATED: Use immediateLogoutService.performImmediateLogout() instead');
    const { isAdminLogout = false } = options;
    return immediateLogoutService.performImmediateLogout(isAdminLogout);
  }

  isLogoutInProgress(): boolean {
    return this.logoutInProgress || immediateLogoutService.isLogoutInProgress();
  }
}

export const logoutService = LogoutService.getInstance();
