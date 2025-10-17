
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileSettingsSidebar from '@/components/profile/settings/ProfileSettingsSidebar';
import ProfileSettingsContent from '@/components/profile/settings/ProfileSettingsContent';
import ResponsiveAppLayout from '@/components/layout/ResponsiveAppLayout';
import { useProfileSettings } from '@/contexts/ProfileSettingsContext';



const ProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    activeSection,
    setActiveSection,
    userInfo,
    setUserInfo,
  } = useProfileSettings();

  useEffect(() => {
    // Always open settings when component mounts, regardless of state
    // This ensures that refreshing the page keeps the settings open
    setIsSettingsOpen(true);
    
    // Read the section from URL parameters and update activeSection
    const searchParams = new URLSearchParams(location.search);
    const sectionFromUrl = searchParams.get('section');
    if (sectionFromUrl) {
      console.log('Setting active section from URL:', sectionFromUrl);
      setActiveSection(sectionFromUrl);
    }
  }, [setIsSettingsOpen, location.search, setActiveSection]);

  // Initial data load handled by useProfileSettings hook to avoid duplicate fetches

  const handleClose = () => {
    setIsSettingsOpen(false);
    
    // Navigate back to profile without settings query params and reset scroll
    navigate('/profile', { replace: true });
    
    // Reset scroll position to top
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  };

  // Keep dialog mounted; loading handled inside content to avoid page flicker

  return (
    <ResponsiveAppLayout>
      <main className="py-8">
        <section aria-labelledby="settings-heading" className="w-full">
          <h1 id="settings-heading" className="sr-only">Profile Settings</h1>
          <div className="mx-auto max-w-6xl">
            <div className="flex gap-4">
              <aside className="w-80 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <ProfileSettingsSidebar activeSection={activeSection} setActiveSection={setActiveSection} onClose={handleClose} />
                </div>
              </aside>
              <article className="flex-1 min-w-0">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <ProfileSettingsContent activeSection={activeSection} />
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>
    </ResponsiveAppLayout>
  );
};

export default ProfileSettings;
