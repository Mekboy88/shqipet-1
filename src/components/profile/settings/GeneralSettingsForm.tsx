/**
 * DO NOT EDIT. This file is locked to maintain perfect sync with SuperBase/Supabase and Admin Settings. 
 * Changes will break real-time accuracy.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import AdminRoleBadge from '@/components/admin/factory/AdminRoleBadge';
import { format } from 'date-fns';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Globe, 
  Clock, 
  Shield,
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Settings,
  Wifi
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserOverview, getLastSyncTime } from '@/lib/data/userOverview';
import { ConnectionStatusBanner, useErrorRecovery } from '@/components/ErrorBoundary/GlobalErrorBoundary';
import { supabase } from '@/integrations/supabase/client';
import { useUniversalUser } from '@/hooks/useUniversalUser';

// Runtime lock protection
if (typeof window !== 'undefined' && 
    typeof import.meta !== 'undefined' && 
    import.meta.env?.DEV && 
    import.meta.env?.LOCK_SYNC_FILES === 'true') {
  console.error('🔒 DO NOT CHANGE THIS. This file should not be changed ever.');
}

interface GeneralSettingsFormProps {
  userInfo: any;
  setUserInfo: (info: any) => void;
  onSave: (data: any) => Promise<boolean>;
  saving: boolean;
  loading: boolean;
}

const GeneralSettingsForm: React.FC<GeneralSettingsFormProps> = ({
  userInfo,
  setUserInfo,
  onSave,
  saving,
  loading
}) => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { firstName: uniFirstName, lastName: uniLastName, role: universalRole } = useUniversalUser(user?.id);

  const firstNameDisplay = (userInfo?.first_name && userInfo.first_name.length > 1)
    ? userInfo.first_name
    : (uniFirstName && uniFirstName.length > 1 ? uniFirstName : (userInfo?.first_name || 'Not set'));

  const lastNameDisplay = userInfo?.last_name || uniLastName || 'Not set';

  // Local DOB parts state (DD, MM, YYYY)
  const [dob, setDob] = useState<{ day: string; month: string; year: string }>({ day: '', month: '', year: '' });

  // Sync local DOB from userInfo (supports both date_of_birth and legacy birthday)
  useEffect(() => {
    const src = (userInfo as any).date_of_birth || (userInfo as any).birthday;
    if (!src) return;

    const setFromParts = (y: string, m: string, d: string) =>
      setDob({ day: d.padStart(2, '0'), month: m.padStart(2, '0'), year: y.padStart(4, '0') });

    if (typeof src === 'string') {
      // Expecting YYYY-MM-DD from DB; avoid Date() to prevent timezone shifts
      const m = src.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) {
        setFromParts(m[1], m[2], m[3]);
        return;
      }
    }
    // Fallback for Date objects or other formats
    try {
      const d = new Date(src as any);
      if (!isNaN(d.getTime())) {
        setFromParts(String(d.getFullYear()), String(d.getMonth() + 1), String(d.getDate()));
      }
    } catch {}
  }, [(userInfo as any).date_of_birth, (userInfo as any).birthday]);

  // Ensure DOB is loaded from DB if missing (keeps values persistent across navigation)
  useEffect(() => {
    if (!user) return;
    const hasLocalDob = dob.year?.length === 4 && dob.month?.length === 2 && dob.day?.length === 2;
    const hasUserDob = Boolean((userInfo as any)?.date_of_birth || (userInfo as any)?.birthday);
    if (hasLocalDob || hasUserDob) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('date_of_birth')
          .eq('id', user.id)
          .maybeSingle();
        if (!error && data?.date_of_birth) {
          const val = String(data.date_of_birth);
          setUserInfo((prev: any) => ({ ...prev, date_of_birth: val, birthday: val }));
          const m = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (m) setDob({ year: m[1], month: m[2], day: m[3] });
        }
      } catch (e) {
        console.warn('DOB fetch fallback failed:', e);
      }
    })();
  }, [user?.id]);

  // Debounced auto-save function for DOB updates
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          try {
            await onSave({ date_of_birth: value, birthday: value });
          } catch (error) {
            console.error('❌ Error auto-saving DOB:', error);
          }
        }, 500);
      };
    })(),
    [onSave]
  );

  // Comprehensive data loading effect - fetch all missing profile data at once
  useEffect(() => {
    const loadCompleteProfileData = async () => {
      try {
        if (!user) return;
        
        // Check what data is missing
        const missingFirst = !userInfo?.first_name || userInfo.first_name.trim() === '';
        const missingLast = !userInfo?.last_name || userInfo.last_name.trim() === '';
        
        const missingDob = !((userInfo as any)?.date_of_birth || (userInfo as any)?.birthday);
        const missingCreated = !userInfo?.created_at;
        const missingLastSignIn = !((userInfo as any)?.last_sign_in_at || (userInfo as any)?.last_login);
        
        console.log('🔍 Profile data check:', {
          userInfo,
          missingFirst,
          missingLast, 
          
          missingDob,
          missingCreated,
          missingLastSignIn,
          
        });
        
        // Only fetch if we're missing important data
        if (!(missingFirst || missingLast || missingDob || missingCreated || missingLastSignIn)) {
          console.log('✅ All profile data present, skipping fetch');
          return;
        }
        
        console.log('🔄 Fetching missing profile data:', { missingFirst, missingLast, missingDob });
        
        // Ensure a profile row exists with basic data
        try {
          const meta: any = (user as any)?.user_metadata || {};
          const deriveFromEmail = (em?: string) => {
            if (!em) return { first: '', last: '' };
            const local = em.split('@')[0];
            const parts = local.split(/[._-]+/).filter(Boolean);
            const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
            return { first: cap(parts[0] || ''), last: cap(parts[1] || '') };
          };
          const derived = deriveFromEmail(user.email || '');
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              first_name: meta.first_name || (userInfo as any)?.first_name || derived.first,
              last_name: meta.last_name || (userInfo as any)?.last_name || derived.last,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        } catch {}
        
        // Fetch profile and role in parallel from public schema (RLS allows own row)
        const [{ data: profileData, error: profileError }, { data: roleData }] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        ]);
        
        // Also get auth metadata for last_sign_in_at
        const authUser = user;
          
        console.log('📊 Database response:', { profileData, profileError, roleData });
          
        if (!profileError && profileData) {
          console.log('✅ Profile data fetched successfully:', profileData);
          
          const updatedInfo = {
            ...userInfo,
            first_name: profileData.first_name || (userInfo as any)?.first_name || (authUser as any)?.user_metadata?.first_name || '',
            last_name: profileData.last_name || (userInfo as any)?.last_name || (authUser as any)?.user_metadata?.last_name || '',
            email: profileData.email || userInfo?.email || authUser?.email,
            country: profileData.country || userInfo?.country,
            timezone: profileData.timezone || userInfo?.timezone,
            language: profileData.language || userInfo?.language,
            phone_number: profileData.phone_number || userInfo?.phone_number,
            email_verified: profileData.email_verified !== undefined ? profileData.email_verified : userInfo?.email_verified,
            phone_verified: profileData.phone_verified !== undefined ? profileData.phone_verified : userInfo?.phone_verified,
            otp_email_pending: profileData.otp_email_pending !== undefined ? profileData.otp_email_pending : userInfo?.otp_email_pending,
            otp_phone_pending: profileData.otp_phone_pending !== undefined ? profileData.otp_phone_pending : userInfo?.otp_phone_pending,
            two_factor_enabled: profileData.two_factor_enabled !== undefined ? profileData.two_factor_enabled : userInfo?.two_factor_enabled,
            profile_completion_percentage: profileData.profile_completion_percentage || userInfo?.profile_completion_percentage || 0,
            date_of_birth: profileData.date_of_birth || (userInfo as any)?.date_of_birth,
            birthday: profileData.date_of_birth || (userInfo as any)?.birthday, // Legacy support
            account_status: profileData.account_status || userInfo?.account_status,
            created_at: profileData.created_at || userInfo?.created_at || authUser?.created_at,
            updated_at: profileData.updated_at || userInfo?.updated_at,
            username: profileData.username || userInfo?.username,
            role: roleData?.role || (profileData as any)?.primary_role || userInfo?.role,
            last_sign_in_at: profileData.last_sign_in_at || (authUser as any)?.last_sign_in_at || userInfo?.last_sign_in_at,
            last_login: userInfo?.last_login,
          };
          
          console.log('🔄 Updating userInfo with:', updatedInfo);
          setUserInfo(updatedInfo);
          
          // Update DOB display if we got new data
          if (profileData.date_of_birth) {
            const dobStr = String(profileData.date_of_birth);
            const m = dobStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (m) {
              console.log('📅 Setting DOB display:', { year: m[1], month: m[2], day: m[3] });
              setDob({ year: m[1], month: m[2], day: m[3] });
            }
          }
        } else if (profileError) {
          console.error('❌ Failed to fetch profile data:', profileError);
        }
      } catch (e) {
        console.warn('❌ Profile data fetch failed:', e);
      }
    };
    
    loadCompleteProfileData();
  }, [user?.id, setUserInfo]);


  const handleManageClick = (section: string) => {
    // Navigate to specific settings section
    navigate(`/profile/settings?section=${section}`);
  };

  const maskEmail = (email: string) => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) return email;
    return localPart.charAt(0) + '••••' + '@' + domain;
  };

  const maskPhone = (phone: string) => {
    if (phone.length <= 4) return phone;
    return phone.slice(0, 3) + ' •••• ' + phone.slice(-4);
  };

  if (loading || !userInfo) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Loading account overview...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">


      {/* Main Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column */}
        <div className="space-y-6">
          
          {/* Account Security Overview */}
          <Card className="shadow-lg border border-gray-200/50">
            <CardHeader className="border-b border-gray-200 pb-4">
              <CardTitle className="flex items-center gap-3 text-xl text-gray-800">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary">
                  <path opacity="0.4" d="M20.9099 11.12C20.9099 16.01 17.3599 20.59 12.5099 21.93C12.1799 22.02 11.8198 22.02 11.4898 21.93C6.63984 20.59 3.08984 16.01 3.08984 11.12V6.73006C3.08984 5.91006 3.70986 4.98007 4.47986 4.67007L10.0498 2.39007C11.2998 1.88007 12.7098 1.88007 13.9598 2.39007L19.5298 4.67007C20.2898 4.98007 20.9199 5.91006 20.9199 6.73006L20.9099 11.12Z" fill="currentColor"></path>
                  <path d="M14.5 10.5C14.5 9.12 13.38 8 12 8C10.62 8 9.5 9.12 9.5 10.5C9.5 11.62 10.24 12.55 11.25 12.87V15.5C11.25 15.91 11.59 16.25 12 16.25C12.41 16.25 12.75 15.91 12.75 15.5V12.87C13.76 12.55 14.5 11.62 14.5 10.5Z" fill="currentColor"></path>
                </svg>
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Two-Factor Authentication (2FA)</div>
                <div className="flex items-center gap-2">
                  {userInfo.two_factor_enabled ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-gray-600">2FA Enabled</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-gray-600">2FA Not Enabled</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <Button
                  onClick={() => handleManageClick('two-factor')}
                  variant="outline"
                  className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/30 !h-auto !min-h-[2.5rem] !px-2 !py-2 !text-xs flex items-center justify-center"
                >
                  <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span>Configure 2FA</span>
                </Button>
                <Button
                  onClick={() => handleManageClick('password')}
                  variant="outline"
                  className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/30 !h-auto !min-h-[3rem] !px-3 !py-3 !text-xs flex items-center justify-center !leading-tight gap-1"
                >
                  <Settings className="h-3 w-3 flex-shrink-0" />
                  <span className="whitespace-nowrap">Change Password</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Location & Preferences Overview */}
          <Card className="shadow-lg border border-gray-200/50">
            <CardHeader className="border-b border-gray-200 pb-4">
              <CardTitle className="flex items-center gap-3 text-xl text-gray-800">
                <svg version="1.0" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64" enableBackground="new 0 0 64 64" xmlSpace="preserve" fill="currentColor" className="h-5 w-5 text-primary">
                  <g>
                    <path fill="currentColor" d="M32,0C18.745,0,8,10.745,8,24c0,5.678,2.502,10.671,5.271,15l17.097,24.156C30.743,63.686,31.352,64,32,64 s1.257-0.314,1.632-0.844L50.729,39C53.375,35.438,56,29.678,56,24C56,10.745,45.255,0,32,0z M32,38c-7.732,0-14-6.268-14-14 s6.268-14,14-14s14,6.268,14,14S39.732,38,32,38z"></path>
                    <path fill="currentColor" d="M32,12c-6.627,0-12,5.373-12,12s5.373,12,12,12s12-5.373,12-12S38.627,12,32,12z M32,34 c-5.523,0-10-4.478-10-10s4.477-10,10-10s10,4.478,10,10S37.523,34,32,34z"></path>
                  </g>
                </svg>
                Location & Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Country
                  </div>
                  <div className="text-gray-900 flex items-center gap-2">
                    {userInfo.country ? (
                      <>
                        <span className="text-lg">🌍</span>
                        <span className="font-semibold">{userInfo.country}</span>
                      </>
                    ) : (
                      <span className="text-gray-500">Not set</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timezone
                  </div>
                  <div className="text-gray-900">{userInfo.timezone || 'Not set'}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language
                </div>
                <div className="text-gray-900 flex items-center gap-2">
                  {userInfo.language ? (
                    <>
                      <span className="text-lg">🌐</span>
                      <span className="font-semibold capitalize">{userInfo.language}</span>
                    </>
                  ) : (
                    <span className="text-gray-500">Not set</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <Button
                  onClick={() => handleManageClick('location-preferences')}
                  variant="outline"
                  className="w-full bg-primary/5 hover:bg-primary/10 text-primary border-primary/30"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Update Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

         </div>
      </div>
    </div>
  );
};

// Verification Badge Component
const VerificationBadge: React.FC<{ isVerified?: boolean; isPending?: boolean }> = ({ 
  isVerified, 
  isPending 
}) => {
  if (isPending) {
    return (
      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
        Pending
      </Badge>
    );
  }
  
  if (isVerified) {
    return (
      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
        Verified
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
      Not verified
    </Badge>
  );
};

export default React.memo(GeneralSettingsForm);