import React, { useState } from 'react';
import '@/components/ui/skeleton-shimmer.css';
import ProfileSidebar from './sidebar/ProfileSidebar';
import PostCreationArea from './content/PostCreationArea';
import SamplePostsFeed from './content/SamplePostsFeed';
import CreatePostCard from '@/components/feed/CreatePostCard';
import { Card } from '@/components/ui/card';
import { CheckCircle, PlusCircle, X, Play } from 'lucide-react';
import ProgressivePost from '@/components/ProgressivePost';
import { useUniversalUser } from '@/hooks/useUniversalUser';
import { useGlobalAvatar } from '@/hooks/useGlobalAvatar';
import { PersonalIntroductionCard } from "./PersonalIntroductionCard";
import { WasabiImageDisplay } from '@/components/fallback/WasabiImageDisplay';
import MobileResponsiveStyles from './MobileResponsiveStyles';
import { processWasabiUrl, isWasabiKey } from '@/services/media/LegacyMediaService';
import { 
  ProfilePhotosGridSkeleton, 
  ProfileVideosGridSkeleton, 
  ProfileTimelineSkeleton,
  ProfileSidebarSkeleton 
} from './skeletons/ProfileSkeleton';

// Component for handling video URLs that might need presigning
const WasabiVideoPlayer: React.FC<{ url: string; className: string; controls?: boolean; autoPlay?: boolean; onLoaded?: () => void }> = ({ url, className, controls = false, autoPlay = false, onLoaded }) => {
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  React.useEffect(() => {
    const generateVideoUrl = async () => {
      try {
        const processedUrl = await processWasabiUrl(url, 900);
        setVideoUrl(processedUrl);
      } catch (error) {
        console.error('❌ Failed to generate video URL:', error);
        setVideoUrl(url); // Fallback to original
      } finally {
        setLoading(false);
      }
    };

    generateVideoUrl();
  }, [url]);

  const handleLoadedData = () => {
    setHasLoaded(true);
    // Hide parent skeleton when video loads
    setTimeout(() => {
      const videoElement = document.querySelector(`video[data-video-url="${url}"]`);
      if (videoElement) {
        const container = videoElement.closest('.relative');
        const skeleton = container?.querySelector('.facebook-skeleton');
        if (skeleton) skeleton.remove();
      }
    }, 100);
  };

  if (loading || !videoUrl) {
    return null; // Let parent skeleton show
  }

  return (
    <video
      src={videoUrl}
      className={`${className} ${hasLoaded ? 'opacity-100' : 'opacity-0'}`}
      muted
      playsInline
      preload="metadata"
      controls={controls}
      autoPlay={autoPlay}
      onLoadedData={handleLoadedData}
      data-video-url={url}
    />
  );
};


const VideoGridItem: React.FC<{ url: string; isActive: boolean; onClick: () => void }> = ({ url, isActive, onClick }) => {
  return (
    <div
      className={`aspect-video overflow-hidden rounded-lg hover-scale cursor-pointer relative group ${isActive ? 'ring-4 ring-blue-500' : ''}`}
      onClick={onClick}
    >
      <WasabiVideoPlayer 
        url={url}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Play className="w-12 h-12 text-white" />
      </div>
    </div>
  );
};

interface ProfileContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: any;
  profilePosts: any[];
  friendSuggestions: any[];
  photoItems: any[];
  videoItems: any[];
  isMobile: boolean;
  onCompletionItemClick: (sectionId: string) => void;
}

const ProfileContent: React.FC<ProfileContentProps> = ({
  activeTab,
  userProfile,
  profilePosts,
  friendSuggestions,
  photoItems,
  videoItems,
  isMobile,
  onCompletionItemClick
}) => {
  const { displayName } = useUniversalUser();
  const { avatarUrl: profileImageUrl, isLoading: avatarLoading } = useGlobalAvatar();
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  // Per-card loading state for grids
  const [loadedPhotoIndices, setLoadedPhotoIndices] = useState<Set<number>>(new Set());
  const [loadedVideoIndices, setLoadedVideoIndices] = useState<Set<number>>(new Set());
  
  // Profile timeline states - same as feed
  const [loadedPostIndices, setLoadedPostIndices] = useState<Set<number>>(new Set());
  const [currentLoadingPost, setCurrentLoadingPost] = useState<number | null>(null);

  // Feed-style post loading handlers
  const handlePostLoadComplete = React.useCallback((index: number) => {
    setLoadedPostIndices(prev => new Set([...prev, index]));
    setCurrentLoadingPost(null);
  }, []);

  // Progressive loading logic - same as feed
  React.useEffect(() => {
    if (profilePosts.length > 0 && loadedPostIndices.size < profilePosts.length && currentLoadingPost === null) {
      const nextUnloadedIndex = Array.from({length: profilePosts.length}, (_, i) => i)
        .find(i => !loadedPostIndices.has(i));
      if (nextUnloadedIndex !== undefined) {
        setCurrentLoadingPost(nextUnloadedIndex);
      }
    }
  }, [profilePosts.length, loadedPostIndices.size, currentLoadingPost]);
  
  // Enhanced completion detection logic
  const completionItems = [
    { 
      id: 'item-1', 
      text: "Shto foton e profilit", 
      completed: !!(profileImageUrl || userProfile.profile_image_url || userProfile.avatar_url), 
      sectionId: 'avatar-and-cover' 
    },
    { 
      id: 'item-2', 
      text: "Shto emrin tënd", 
      completed: !!(userProfile.firstName || userProfile.first_name || userProfile.displayName || userProfile.display_name), 
      sectionId: 'profile' 
    },
    { 
      id: 'item-3', 
      text: "Shto vendin e punës", 
      completed: !!(userProfile.workingAt || userProfile.working_at || userProfile.workplace || userProfile.work_place), 
      sectionId: 'profile' 
    },
    { 
      id: 'item-4', 
      text: "Shto vendin tënd", 
      completed: !!(userProfile.country && userProfile.country !== 'Select Country'), 
      sectionId: 'general' 
    },
    { 
      id: 'item-5', 
      text: "Shto adresën", 
      completed: !!(userProfile.addresses && userProfile.addresses.length > 0), 
      sectionId: 'addresses' 
    }
  ];

  const completedCount = completionItems.filter(item => item.completed).length;
  const completionPercentage = Math.round((completedCount / completionItems.length) * 100);

  // Real online/offline status detection
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [lastSeen, setLastSeen] = React.useState(new Date());

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setLastSeen(new Date());
    };

    // Listen to browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Track user activity to determine if they're actively using the page
    let activityTimer: NodeJS.Timeout;
    const resetActivityTimer = () => {
      clearTimeout(activityTimer);
      if (navigator.onLine) {
        setIsOnline(true);
      }
      // Set user as inactive after 5 minutes of no activity
      activityTimer = setTimeout(() => {
        if (navigator.onLine) {
          // Still connected but inactive
          setLastSeen(new Date());
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Activity events
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetActivityTimer, { passive: true });
    });

    // Initialize activity timer
    resetActivityTimer();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(activityTimer);
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetActivityTimer);
      });
    };
  }, []);

  // Improved video file detection logic
  const isVideoFile = (url: string) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.3gp', '.ogg', '.ogv', '.flv', '.wmv'];
    const lowerUrl = url.toLowerCase();
    
    // Check for video extensions
    const hasVideoExtension = videoExtensions.some(ext => lowerUrl.endsWith(ext) || lowerUrl.includes(ext + '?'));
    
    // Check for video indicators in URL
    const hasVideoIndicator = lowerUrl.includes('/video/') || lowerUrl.includes('video-');
    
    // Check for specific video MIME types
    const hasMimeType = lowerUrl.includes('video/');
    
    return hasVideoExtension || hasVideoIndicator || hasMimeType;
  };

  // Improved photo file detection logic
  const isPhotoFile = (url: string) => {
    if (!url) return false;
    
    // First check if it's a video file - if so, it's not a photo
    if (isVideoFile(url)) return false;
    
    const photoExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.ico'];
    const lowerUrl = url.toLowerCase();
    
    // Check for photo extensions
    const hasPhotoExtension = photoExtensions.some(ext => lowerUrl.endsWith(ext) || lowerUrl.includes(ext + '?'));
    
    // Check for image indicators in URL
    const hasImageIndicator = lowerUrl.includes('/image/') || lowerUrl.includes('image-');
    
    // Check for specific image MIME types
    const hasMimeType = lowerUrl.includes('image/');
    
    return hasPhotoExtension || hasImageIndicator || hasMimeType;
  };

  // Get post count
  const postCount = profilePosts.length;
  
  // Accurate video count logic
  const videoCount = profilePosts.filter(post => {
    // Check if post type is specifically video
    if (post.post_type === 'video' || post.post_type === 'video_post' || post.post_type === 'reel') return true;
    
    // Check content_images array for video files
    if (post.content_images && Array.isArray(post.content_images)) {
      return post.content_images.some(url => isVideoFile(url));
    }
    
    // Check legacy content.images structure
    if (post.content && post.content.images && Array.isArray(post.content.images)) {
      return post.content.images.some(url => isVideoFile(url));
    }
    
    return false;
  }).length;

  // Fixed photo count logic - count posts that have actual photo files
  const photoCount = profilePosts.filter(post => {
    // For posts with image post type
    if (post.post_type === 'image') return true;
    
    // For media posts, check if they contain photos (but not videos)
    if (post.post_type === 'media') {
      // Check content_images array for photo files (excluding videos)
      if (post.content_images && Array.isArray(post.content_images)) {
        return post.content_images.some(url => isPhotoFile(url));
      }
      
      // Check legacy content.images structure
      if (post.content && post.content.images && Array.isArray(post.content.images)) {
        return post.content.images.some(url => isPhotoFile(url));
      }
    }
    
    // For regular posts, check if they have photo content
    if (post.post_type === 'regular' || !post.post_type) {
      // Check content_images array
      if (post.content_images && Array.isArray(post.content_images)) {
        return post.content_images.some(url => isPhotoFile(url));
      }
      
      // Check legacy content.images structure
      if (post.content && post.content.images && Array.isArray(post.content.images)) {
        return post.content.images.some(url => isPhotoFile(url));
      }
    }
    
    return false;
  }).length;

  console.log('📊 Updated Profile counts debug:', {
    totalPosts: profilePosts.length,
    videoCount,
    photoCount,
    posts: profilePosts.map(post => ({
      id: post.id,
      postType: post.post_type,
      contentImages: post.content_images,
      legacyContentImages: post.content?.images,
      hasVideo: post.post_type === 'video' || post.post_type === 'video_post' || post.post_type === 'reel' || 
        (post.content_images && post.content_images.some(url => isVideoFile(url))) ||
        (post.content?.images && post.content.images.some(url => isVideoFile(url))),
      hasPhoto: post.post_type === 'image' || 
        (post.content_images && post.content_images.some(url => isPhotoFile(url))) ||
        (post.content?.images && post.content.images.some(url => isPhotoFile(url)))
    }))
  });

  const gender = userProfile.gender || 'male';
  const genderTextColor = gender.toLowerCase() === 'female' ? 'text-pink-400' : 'text-blue-400';

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 -mt-6 sm:-mt-12 profile-content" style={{ minWidth: 'auto', flexShrink: 1 }}>
      <MobileResponsiveStyles />
      
      {/* Personal Introduction Section */}
      <div className="mb-4 sm:mb-6">
        <PersonalIntroductionCard isDisplayMode={true} />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 relative profile-content-grid">
        {/* Video Player Modal - Fixed top positioning and improved layout */}
        {selectedVideo && (
          <div className="fixed top-14 left-0 right-0 bottom-0 bg-white z-50 flex">
            {/* Video Player - Left Half */}
            <div className="w-1/2 h-full flex items-center justify-center p-6 bg-black">
              <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-lg shadow-lg shadow-black/30 hover:bg-opacity-75 hover:shadow-xl hover:shadow-black/40 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
                <WasabiVideoPlayer 
                  url={selectedVideo}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                />
              </div>
            </div>
            
            {/* Video Grid - Right Half */}
            <div className="w-1/2 h-full overflow-y-auto p-6 bg-gray-50">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">All Videos</h2>
                {videoItems.length > 0 ? (
                  (() => {
                    const groups = [];
                    for (let i = 0; i < videoItems.length; i += 3) {
                      groups.push(videoItems.slice(i, i + 3));
                    }
                    return groups.map((groupVideos, groupIndex) => (
                      <div key={groupIndex} className="grid grid-cols-3 gap-4">
                        {groupVideos.map((video, index) => (
                          <VideoGridItem
                            key={`${groupIndex}-${index}`}
                            url={video}
                            isActive={selectedVideo === video}
                            onClick={() => setSelectedVideo(video)}
                          />
                        ))}
                      </div>
                    ));
                  })()
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-lg">No videos yet</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Photo Viewer Modal - Fixed positioning to show full page */}
        {selectedPhoto && (
          <div className="fixed top-14 left-0 right-0 bottom-0 bg-white z-50 flex">
            {/* Photo Viewer - Left Half */}
            <div className="w-1/2 h-full flex items-center justify-center p-6 bg-black">
              <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-lg shadow-lg shadow-black/30 hover:bg-opacity-75 hover:shadow-xl hover:shadow-black/40 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
                <WasabiImageDisplay
                  url={selectedPhoto}
                  alt="Selected photo"
                  className="w-full h-full object-contain"
                  aspectRatio="w-full h-full"
                />
              </div>
            </div>
            
            {/* Photo Grid - Right Half */}
            <div className="w-1/2 h-full overflow-y-auto p-6 bg-gray-50">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">All Photos</h2>
                {photoItems.length > 0 ? (
                  <div className="space-y-6">
                    {Array.from({ length: Math.ceil(photoItems.length / 33) }).map((_, groupIndex) => {
                      const startIndex = groupIndex * 33;
                      const groupPhotos = photoItems.slice(startIndex, startIndex + 33);
                      
                      return (
                        <div key={groupIndex} className="space-y-4">
                          {/* 32 photos in 4x8 grid */}
                          {groupPhotos.slice(0, 32).length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                              {groupPhotos.slice(0, 32).map((photo, index) => (
                                <div 
                                  key={`${groupIndex}-small-${index}`} 
                                  className={`aspect-square overflow-hidden rounded-lg bg-gray-100 hover:scale-105 transition-transform duration-200 cursor-pointer ${
                                    selectedPhoto === photo ? 'ring-4 ring-blue-500' : ''
                                  }`}
                                  onClick={() => setSelectedPhoto(photo)}
                                >
                                  <WasabiImageDisplay
                                    url={photo} 
                                    alt={`Photo ${startIndex + index + 1}`}
                                    className="w-full h-full object-cover"
                                    aspectRatio="aspect-square"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Big photo (33rd photo) - size equivalent to 8 small cards */}
                          {groupPhotos[32] && (
                            <div 
                              className={`w-full overflow-hidden rounded-lg hover-scale cursor-pointer ${
                                selectedPhoto === groupPhotos[32] ? 'ring-4 ring-blue-500' : ''
                              }`} 
                              style={{ aspectRatio: '2/1' }}
                              onClick={() => setSelectedPhoto(groupPhotos[32])}
                            >
                              <WasabiImageDisplay
                                url={groupPhotos[32]} 
                                alt={`Photo ${startIndex + 33}`}
                                className="w-full h-full object-cover"
                                aspectRatio="2/1"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-lg">No photos yet</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="w-full order-2 lg:order-1 overflow-hidden" style={{ minWidth: '0', flexShrink: 1, maxWidth: '100%' }}>
          {activeTab === 'timeline' ? (
            <>
              {/* Create Post Section - same as feed */}
              <CreatePostCard />

              {/* Posts list with progressive loading - identical to feed */}
              {profilePosts.length > 0 ? (
                <div className="space-y-4 mt-4 pb-20">
                  {profilePosts.map((post, index) => {
                    // Determine if this post should load - same logic as feed
                    const shouldLoad = loadedPostIndices.has(index) || index === currentLoadingPost || index === 0;
                    
                    return (
                      <ProgressivePost 
                        key={`profile-post-${index}-${post.id}`} 
                        post={post} 
                        showPiP={false}
                        index={index}
                        shouldLoad={shouldLoad}
                        onLoadComplete={handlePostLoadComplete}
                      />
                    );
                  })}
                </div>
              ) : (
                <Card className="p-4 text-center text-muted-foreground bg-white border-gray-100 mt-4">
                  Ende nuk keni krijuar postimin tuaj të parë në Shqipet.
                </Card>
              )}
            </>
          ) : activeTab === 'photos' ? (
            <div className="mt-4">
              {photoItems.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {photoItems.map((photo, index) => (
                    <div 
                      key={index} 
                      className="aspect-square relative overflow-hidden rounded-md cursor-pointer hover-scale group"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      {!loadedPhotoIndices.has(index) && (
                        <div className="facebook-skeleton absolute inset-0" />
                      )}
                      <WasabiImageDisplay
                        url={photo}
                        alt={`Photo ${index + 1}`}
                        className="relative z-10 w-full h-full object-cover rounded-md transition-opacity duration-300"
                        aspectRatio="w-full h-full"
                        onLoaded={() => setLoadedPhotoIndices(prev => new Set([...prev, index]))}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="p-6 sm:p-8 bg-white text-center">
                  <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xmlSpace="preserve" fill="#000000" className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path style={{fill:"#F4F4F4"}} d="M120.108,260.222V57.074c0-14.434,11.701-26.135,26.135-26.135h216.493 c14.434,0,26.135,11.701,26.135,26.135v203.147H120.108z"></path> <path style={{fill:"#C8C6CD"}} d="M388.872,260.222V134.09L285.593,94.115c-15.464-5.985-32.852,1.699-38.838,17.163l-57.65,148.945 L388.872,260.222z"></path> <rect x="157.919" y="68.915" style={{fill:"#F09EA0"}} width="193.178" height="137.925"></rect> <path style={{fill:"#EF8990"}} d="M351.095,206.839v-87.372l-65.502-25.354c-15.464-5.985-32.852,1.699-38.838,17.163l-36.989,95.562 H351.095z"></path> <path style={{fill:"#F4F4F4"}} d="M172.072,359.624l87.515-226.102c5.211-13.461,20.346-20.15,33.807-14.94l201.897,78.147 c13.461,5.211,20.15,20.346,14.94,33.807L432.081,432.44c-5.209,13.458-20.34,20.148-33.8,14.942l-226.001-87.401L172.072,359.624z"></path> <polyline style={{fill:"#F9DE8F"}} points="253.66,253.961 290.771,158.081 470.922,227.809 415.402,371.251 318.241,333.643 "></polyline> <g> <circle style={{fill:"#F7CF6D"}} cx="327.767" cy="225.242" r="22.876"></circle> <circle style={{fill:"#F7CF6D"}} cx="396.73" cy="254.1" r="22.876"></circle> </g> <path style={{fill:"#F9DE8F"}} d="M291.905,481.059H23.939C10.718,481.059,0,470.342,0,457.121V278.043 c0-13.221,10.718-23.939,23.939-23.939h267.968c13.221,0,23.939,10.718,23.939,23.939v179.079 C315.844,470.342,305.126,481.059,291.905,481.059z"></path> <path style={{fill:"#F7CF6D"}} d="M291.905,254.104h-21.219c13.221,0,23.939,10.718,23.939,23.939v179.079 c0,13.221-10.718,23.938-23.939,23.938h21.219c13.221,0,23.939-10.718,23.939-23.938V278.043 C315.844,264.822,305.126,254.104,291.905,254.104z"></path> <path style={{fill:"#F9DE8F"}} d="M203.781,288.888h-91.717c-13.221,0-23.939-10.718-23.939-23.939v-20.191 c0-13.221,10.718-23.939,23.939-23.939h91.717c13.221,0,23.939,10.718,23.939,23.939v20.191 C227.718,278.17,217.001,288.888,203.781,288.888z"></path> <path style={{fill:"#F7CF6D"}} d="M203.781,220.819h-20.63c13.221,0,23.939,10.718,23.939,23.938v20.191 c0,13.221-10.717,23.939-23.939,23.939h20.63c13.221,0,23.939-10.718,23.939-23.939v-20.191 C227.718,231.537,217.001,220.819,203.781,220.819z"></path> <path style={{fill:"#88E2E2"}} d="M65.753,288.888H36.666c-5.438,0-9.846-4.409-9.846-9.846v-28.184c0-5.438,4.409-9.846,9.846-9.846 h29.087c5.438,0,9.846,4.409,9.846,9.846v28.184C75.598,284.479,71.191,288.888,65.753,288.888z"></path> <g> <path style={{fill:"#F09EA0"}} d="M315.844,288.888H0v-10.845c0-13.221,10.718-23.939,23.939-23.939h267.968 c13.221,0,23.939,10.718,23.939,23.939v10.845H315.844z"></path> <path style={{fill:"#F09EA0"}} d="M0,446.276h315.844v10.845c0,13.221-10.718,23.939-23.939,23.939H23.939 C10.718,481.059,0,470.342,0,457.121V446.276z"></path> </g> <g> <path style={{fill:"#EF8990"}} d="M310.378,262.815c-4.39-5.32-11.035-8.712-18.471-8.712h-21.219 c13.221,0,23.939,10.718,23.939,23.939v10.845h21.219v-10.845C315.844,272.258,313.792,266.953,310.378,262.815z"></path> <path style={{fill:"#EF8990"}} d="M294.625,457.121c0,13.221-10.718,23.938-23.939,23.938h21.219c10.742,0,19.832-7.075,22.863-16.82 c0.699-2.249,1.076-4.64,1.076-7.119v-10.845h-21.219V457.121z"></path> </g> <circle style={{fill:"#F4F4F4"}} cx="157.919" cy="358.24" r="82.323"></circle> <circle style={{fill:"#59D3C4"}} cx="157.919" cy="358.24" r="61.3"></circle> <circle style={{fill:"#88E2E2"}} cx="157.919" cy="358.24" r="40.116"></circle> <circle style={{fill:"#F4F4F4"}} cx="267.163" cy="289.678" r="15.718"></circle> </g></svg>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Nuk ka foto të disponueshme
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Posto foto për t'i parë këtu
                  </p>
                </Card>
              )}
            </div>
          ) : activeTab === 'videos' ? (
            <div className="mt-4">
              {videoItems.length > 0 ? (
                <div className="space-y-4">
                  {Array.from({ length: Math.ceil(videoItems.length / 3) }).map((_, groupIndex) => {
                    const startIndex = groupIndex * 3;
                    const groupVideos = videoItems.slice(startIndex, startIndex + 3);
                    
                    return (
                      <div key={groupIndex} className="grid grid-cols-3 gap-4">
                        {groupVideos.map((video, index) => (
                          <div 
                            key={`${groupIndex}-${index}`} 
                            className="aspect-video overflow-hidden rounded-lg hover-scale cursor-pointer relative group"
                            onClick={() => setSelectedVideo(video)}
                          >
                            {!loadedVideoIndices.has(startIndex + index) && (
                              <div className="facebook-skeleton absolute inset-0" />
                            )}
                            <WasabiVideoPlayer
                              url={video} 
                              className="relative z-10 w-full h-full object-cover transition-opacity duration-300"
                              onLoaded={() => setLoadedVideoIndices(prev => new Set([...prev, startIndex + index]))}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                              <Play className="w-12 h-12 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-6 sm:p-8 bg-white text-center">
                  <svg 
                    className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" 
                    viewBox="0 0 501.551 501.551" 
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path style={{fill:"#40596B"}} d="M367.804,185.309H20.898C9.404,185.309,0,194.713,0,206.207v273.763 c0,11.494,9.404,20.898,20.898,20.898h346.906c11.494,0,20.898-9.404,20.898-20.898V206.207 C388.702,194.713,379.298,185.309,367.804,185.309z"></path>
                    <path style={{fill:"#334A5E"}} d="M473.339,186.354l-84.637,50.155v213.159l84.637,50.155c13.584,5.224,28.212-5.224,28.212-19.853 V205.162C501.551,190.534,486.922,181.13,473.339,186.354z"></path>
                    <circle style={{fill:"#84DBFF"}} cx="295.706" cy="93.358" r="92.996"></circle>
                    <circle style={{fill:"#40596B"}} cx="295.706" cy="93.358" r="8.359"></circle>
                    <g>
                      <circle style={{fill:"#FFFFFF"}} cx="295.706" cy="36.934" r="24.033"></circle>
                      <circle style={{fill:"#FFFFFF"}} cx="295.706" cy="149.783" r="24.033"></circle>
                      <circle style={{fill:"#FFFFFF"}} cx="352.131" cy="93.358" r="24.033"></circle>
                      <circle style={{fill:"#FFFFFF"}} cx="239.282" cy="93.358" r="24.033"></circle>
                    </g>
                    <circle style={{fill:"#84DBFF"}} cx="92.996" cy="93.358" r="92.996"></circle>
                    <circle style={{fill:"#40596B"}} cx="92.996" cy="93.358" r="8.359"></circle>
                    <g>
                      <circle style={{fill:"#FFFFFF"}} cx="92.996" cy="36.934" r="24.033"></circle>
                      <circle style={{fill:"#FFFFFF"}} cx="92.996" cy="149.783" r="24.033"></circle>
                      <circle style={{fill:"#FFFFFF"}} cx="149.42" cy="93.358" r="24.033"></circle>
                      <circle style={{fill:"#FFFFFF"}} cx="36.571" cy="93.358" r="24.033"></circle>
                    </g>
                    <rect x="31.347" y="385.93" style={{fill:"#FFD15C"}} width="146.286" height="83.592"></rect>
                    <g>
                      <circle style={{fill:"#FF7058"}} cx="259.135" cy="427.726" r="13.584"></circle>
                      <circle style={{fill:"#FF7058"}} cx="307.2" cy="427.726" r="13.584"></circle>
                    </g>
                  </svg>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Nuk ka video të disponueshme
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Posto video për t'i parë këtu
                  </p>
                </Card>
              )}
            </div>
          ) : (
            <Card className="p-6 sm:p-8 bg-white text-center mt-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Përmbajtja do të shtohet së shpejti
              </h3>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0 order-1 lg:order-2">
          {/* Info Card */}
          <Card className="p-3 sm:p-4 mb-4 bg-white">
            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Informacione</h3>
            <div className="border-b border-gray-200 mb-2 sm:mb-3"></div>
            
            <div className="flex items-center text-xs sm:text-sm mb-2">
              <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {!isOnline && (
                <span className="text-gray-400 ml-2">
                  (Para {Math.floor((new Date().getTime() - lastSeen.getTime()) / 60000)} minutash)
                </span>
              )}
            </div>
            
            <div className="text-xs sm:text-sm text-gray-600 mb-1">
              {postCount} {postCount === 1 ? 'postim' : 'postime'}
            </div>
            
            <div className="text-xs sm:text-sm text-gray-600 mb-1">
              {videoCount} {videoCount === 1 ? 'video' : 'video'}
            </div>

            <div className="text-xs sm:text-sm text-gray-600 mb-1">
              {photoCount} {photoCount === 1 ? 'foto' : 'foto'}
            </div>
            
            <div className="border-b border-gray-200 mb-1"></div>
            
            <div className={`text-xs sm:text-sm ${genderTextColor} font-medium`}>
              {gender.toLowerCase() === 'female' ? 'Femër' : 'Mashkull'}
            </div>
          </Card>

          <Card className="p-3 sm:p-4 mb-4 bg-white">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Albumet (0)</h3>
            </div>
            <div className="text-center py-6 sm:py-8 text-gray-500 text-xs sm:text-sm">
              Nuk ka albume për të treguar
            </div>
          </Card>

          <Card className="p-3 sm:p-4 mb-4 bg-white">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Duke ndjekur (1)</h3>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-full mr-2 sm:mr-3"></div>
              <div>
                <div className="font-medium text-gray-900 text-sm sm:text-base">Deen Doughouz</div>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 mb-4 bg-white">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Ndjekësit (0)</h3>
            </div>
            <div className="text-center py-6 sm:py-8 text-gray-500 text-xs sm:text-sm">
              Nuk ka ndjekës për të treguar
            </div>
          </Card>

          <Card className="p-3 sm:p-4 bg-white">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Pëlqimet (0)</h3>
            </div>
            <div className="text-center py-6 sm:py-8 text-gray-500 text-xs sm:text-sm">
              Nuk ka pëlqime për të treguar
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileContent;
