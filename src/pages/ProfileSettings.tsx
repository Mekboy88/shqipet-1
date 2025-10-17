
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileSettingsSidebar from '@/components/profile/settings/ProfileSettingsSidebar';
import ProfileSettingsContent from '@/components/profile/settings/ProfileSettingsContent';
import ProfileSidebar from '@/components/profile/sidebar/ProfileSidebar';
import { useProfileSettings } from '@/contexts/ProfileSettingsContext';
import { useProfileSettings as useProfileSettingsHook } from '@/hooks/useProfileSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPhotos } from '@/hooks/useUserPhotos';
import { usePostsData } from '@/contexts/posts/usePostsData';



const ProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { userInfo: profileSettings } = useProfileSettingsHook();
  const { getPhotosForDisplay } = useUserPhotos(user?.id);
  const { posts: allPosts } = usePostsData();
  
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    activeSection,
    setActiveSection,
    userInfo,
    setUserInfo,
  } = useProfileSettings();

  // Get user's posts and photos for sidebar
  const posts = allPosts.filter(p => p.user_id === user?.id);
  const dbPhotos = getPhotosForDisplay();
  
  // Transform friends from posts (simple placeholder)
  const transformedFriends = posts.slice(0, 9).map((post, index) => ({
    id: index + 1,
    name: `Friend ${index + 1}`,
    imageUrl: '/placeholder.svg',
    category: ['all']
  }));

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
    <div className="min-h-screen bg-gray-100 w-full">
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex gap-4">
            {/* Left Sidebar - Settings Navigation */}
            <aside className="w-80 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <ProfileSettingsSidebar 
                  activeSection={activeSection} 
                  setActiveSection={setActiveSection} 
                  onClose={handleClose} 
                />
              </div>
            </aside>
            
            {/* Middle - Settings Content */}
            <article className="flex-1 min-w-0">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <ProfileSettingsContent activeSection={activeSection} />
              </div>
            </article>
            
            {/* Right Sidebar - Profile Info */}
            <aside className="w-80 flex-shrink-0 hidden xl:block">
              <ProfileSidebar
                userProfile={profileSettings || { stats: { friends: 0 } }}
                photoItems={dbPhotos}
                friendSuggestions={transformedFriends}
                isMobile={false}
                hideIntroAndFeatured={false}
              />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileSettings;
