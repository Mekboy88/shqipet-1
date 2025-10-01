import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useOTPVerification } from '@/hooks/auth/useOTPVerification';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PasswordInputField } from './password/PasswordInputField';
import { TwoFactorAuthSection } from './password/TwoFactorAuthSection';
import { OTPVerificationFlow } from './password/OTPVerificationFlow';
import { UserProfile } from '@/types/user';

const PasswordSettingsForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState('disable');
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  
  // Forgot password states
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  
  // User profile state
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  
  const { generateOTP, verifyOTP, isGenerating, isVerifying } = useOTPVerification();

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Nuk u gjet përdoruesi');
          return;
        }

        // Get user profile from profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('email, phone_number')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          // If no profile exists, use auth user email
          setUserProfile({ email: user.email });
        } else {
          setUserProfile({
            email: profile.email || user.email,
            phone_number: profile.phone_number
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Gabim në marrjen e të dhënave të përdoruesit');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const validateCurrentPassword = async (password: string): Promise<boolean> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        toast.error('Nuk u gjet përdoruesi');
        return false;
      }

      // Try to sign in with current credentials to validate password
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      });

      if (error) {
        console.error('Current password validation failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Password validation error:', error);
      return false;
    }
  };

  const handleNormalPasswordChange = async () => {
    if (!currentPassword || !newPassword || !repeatPassword) {
      toast.error('Ju lutemi plotësoni të gjitha fushat');
      return;
    }
    
    if (newPassword !== repeatPassword) {
      toast.error('Fjalëkalimet e reja nuk përputhen');
      return;
    }

    // CRITICAL: Validate current password before allowing change
    console.log('Validating current password...');
    const isCurrentPasswordValid = await validateCurrentPassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      toast.error('Fjalëkalimi aktual është gabim');
      return;
    }

    try {
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password change failed:', error);
        toast.error('Gabim në ndryshimin e fjalëkalimit');
        return;
      }

      console.log('Password changed successfully with proper validation');
      toast.success('Fjalëkalimi u ndryshua me sukses');
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setRepeatPassword('');
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Gabim në ndryshimin e fjalëkalimit');
    }
  };

  const handleForgotPassword = () => {
    setIsForgotPasswordMode(true);
    setCurrentPassword('');
  };

  const handleSendOTP = async () => {
    if (!selectedMethod) {
      toast.error('Ju lutemi zgjidhni një metodë verifikimi');
      return;
    }
    
    const contact = selectedMethod === 'email' ? userProfile.email : userProfile.phone_number;
    
    try {
      const result = await generateOTP(contact);
      if (result.success) {
        setOtpSent(true);
        toast.success(`Kodi i verifikimit u dërgua në ${selectedMethod === 'email' ? 'email' : 'telefon'}`);
      } else {
        toast.error(result.error || 'Gabim në dërgimin e kodit');
      }
    } catch (error) {
      toast.error('Gabim në dërgimin e kodit të verifikimit');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Ju lutemi shkruani kodin 6-shifror');
      return;
    }
    
    const contact = selectedMethod === 'email' ? userProfile.email : userProfile.phone_number;
    
    try {
      const result = await verifyOTP(contact, otpCode);
      if (result.success) {
        setOtpVerified(true);
        toast.success('Kodi u verifikua me sukses. Mund të ndryshoni fjalëkalimin');
      } else {
        toast.error(result.error || 'Kodi i gabuar');
      }
    } catch (error) {
      toast.error('Gabim në verifikimin e kodit');
    }
  };

  const handlePasswordChangeWithOTP = async () => {
    if (!newPassword || !repeatPassword) {
      toast.error('Ju lutemi plotësoni fjalëkalimet e reja');
      return;
    }
    
    if (newPassword !== repeatPassword) {
      toast.error('Fjalëkalimet e reja nuk përputhen');
      return;
    }

    try {
      // Update password using Supabase Auth (OTP verified, no current password needed)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password change with OTP failed:', error);
        toast.error('Gabim në ndryshimin e fjalëkalimit');
        return;
      }

      console.log('Password changed successfully with OTP verification');
      toast.success('Fjalëkalimi u ndryshua me sukses');
      
      // Reset everything
      setIsForgotPasswordMode(false);
      setOtpSent(false);
      setOtpVerified(false);
      setSelectedMethod('');
      setOtpCode('');
      setCurrentPassword('');
      setNewPassword('');
      setRepeatPassword('');
    } catch (error) {
      console.error('Password change with OTP error:', error);
      toast.error('Gabim në ndryshimin e fjalëkalimit');
    }
  };

  const resetForgotPassword = () => {
    setIsForgotPasswordMode(false);
    setOtpSent(false);
    setOtpVerified(false);
    setSelectedMethod('');
    setOtpCode('');
  };

  if (loading) {
    return (
      <div className="space-y-8 p-4 sm:p-6">
        <div className="flex items-center justify-center">
          <p className="text-gray-600">Duke ngarkuar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Change Password Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
              Change Password
            </h3>
            
            <div className="space-y-6">
              {isForgotPasswordMode ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold">Keni harruar fjalëkalimin?</h4>
                    <Button 
                      variant="outline" 
                      onClick={resetForgotPassword}
                      className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 font-medium transition-all duration-200 hover:shadow-md"
                    >
                      Anulo
                    </Button>
                  </div>
                  
                  <OTPVerificationFlow
                    userProfile={userProfile}
                    selectedMethod={selectedMethod}
                    setSelectedMethod={setSelectedMethod}
                    otpSent={otpSent}
                    setOtpSent={setOtpSent}
                    otpVerified={otpVerified}
                    otpCode={otpCode}
                    setOtpCode={setOtpCode}
                    onSendOTP={handleSendOTP}
                    onVerifyOTP={handleVerifyOTP}
                    onReset={resetForgotPassword}
                    isGenerating={isGenerating}
                    isVerifying={isVerifying}
                  />
                </div>
              ) : (
                <PasswordInputField
                  id="current-password"
                  label="Fjalëkalimi aktual"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  showPassword={showCurrentPassword}
                  onToggleVisibility={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={isForgotPasswordMode && otpVerified}
                />
              )}
              
              <div className="grid grid-cols-1 gap-6">
                <PasswordInputField
                  id="new-password"
                  label="Fjalëkalimi i ri"
                  value={newPassword}
                  onChange={setNewPassword}
                  showPassword={showNewPassword}
                  onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
                />
                <PasswordInputField
                  id="repeat-password"
                  label="Përsërit fjalëkalimin"
                  value={repeatPassword}
                  onChange={setRepeatPassword}
                  showPassword={showRepeatPassword}
                  onToggleVisibility={() => setShowRepeatPassword(!showRepeatPassword)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Security Settings Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
              Security Settings
            </h3>
            
            <TwoFactorAuthSection
              twoFactor={twoFactor}
              setTwoFactor={setTwoFactor}
            />
          </div>

          {/* Action Buttons Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
              Actions
            </h3>
            
            <div className="space-y-4">
              {!isForgotPasswordMode ? (
                <>
                  <Button
                    onClick={handleNormalPasswordChange}
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white border-blue-500 font-medium transition-all duration-200 hover:shadow-md rounded-md"
                  >
                    Ndrysho fjalëkalimin
                  </Button>
                  <Button
                    onClick={handleForgotPassword}
                    variant="outline"
                    className="w-full px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300 font-medium transition-all duration-200 hover:shadow-md rounded-md"
                  >
                    Keni harruar fjalëkalimin?
                  </Button>
                </>
              ) : (
                otpVerified && (
                  <Button
                    onClick={handlePasswordChangeWithOTP}
                    className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white border-green-500 font-medium transition-all duration-200 hover:shadow-md rounded-md"
                  >
                    Ruaj fjalëkalimin e ri
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordSettingsForm;
