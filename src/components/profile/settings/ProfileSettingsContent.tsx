
import React, { useEffect, useRef } from 'react';
import ProfileSettingsHeader from './ProfileSettingsHeader';
import { settingsSections } from './settingsData';
import { settingsComponentMap } from './settingsSectionsMap';
import { useProfileSettings as useProfileSettingsHook } from '@/hooks/useProfileSettings';
import SettingsSkeleton from './SettingsSkeleton';
import ProfileSettingsSkeleton from './ProfileSettingsSkeleton';

interface ProfileSettingsContentProps {
  activeSection: string;
}

const ProfileSettingsContent: React.FC<ProfileSettingsContentProps> = ({
  activeSection
}) => {
  const { userInfo, setUserInfo, saving, saveSettings, loading } = useProfileSettingsHook();
  const hasLoadedOnceRef = useRef(false);
  useEffect(() => {
    if (!loading) hasLoadedOnceRef.current = true;
  }, [loading]);
  const stableLoading = hasLoadedOnceRef.current ? false : loading;

  // Determine section robustly and default to 'profile' if the activeSection is invalid.
  const resolveSection = (section?: string) => {
    if (!section) return 'profile';
    const s = section.toLowerCase();
    if (settingsComponentMap[s]) return s;
    const norm = s.replace(/_/g, '-');
    if (settingsComponentMap[norm]) return norm;
    if (s.includes('avatar') && s.includes('cover') && settingsComponentMap['avatar-and-cover']) return 'avatar-and-cover';
    if (s.includes('session') && (settingsComponentMap['manage-sessions'] || settingsComponentMap['sessions'])) {
      return settingsComponentMap['manage-sessions'] ? 'manage-sessions' : 'sessions';
    }
    return 'profile';
  };
  const currentSection = resolveSection(activeSection);
  const Component = settingsComponentMap[currentSection];

  if (loading && !hasLoadedOnceRef.current) {
    if (currentSection === 'profile') {
      return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 p-4 lg:p-6 overflow-y-auto border-l border-gray-200 lg:border-l-0 max-h-[calc(100vh-2rem)] pointer-events-auto relative z-[1000000]">
            <ProfileSettingsSkeleton />
          </div>
        </div>
      );
    }
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto border-l border-gray-200 lg:border-l-0 max-h-[calc(100vh-2rem)] pointer-events-auto relative z-[1000000]">
          <SettingsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto border-l border-gray-200 lg:border-l-0 max-h-[calc(100vh-2rem)] pointer-events-auto relative z-[1000000]">
        <ProfileSettingsHeader activeSection={currentSection} userInfo={userInfo} />
        
        <div className="w-full pb-8">
          {Component ? (
            <Component 
              userInfo={userInfo} 
              setUserInfo={setUserInfo}
              onSave={saveSettings}
              saving={saving}
              loading={stableLoading}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsContent;
