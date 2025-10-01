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
                  <svg 
                    className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" 
                    viewBox="0 0 512 512" 
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path style={{fill:"#F0E9DD"}} d="M502.157,176.551v271.216c0,11.566-9.387,20.941-20.954,20.941H30.792 c-11.567,0-20.941-9.374-20.941-20.941V176.551c0-11.566,9.374-20.954,20.941-20.954h77.565c10.07,0,18.892-6.748,21.518-16.477 l8.626-32.021c2.613-9.728,11.435-16.477,21.505-16.477H351.99c10.07,0,18.892,6.748,21.518,16.477l8.626,32.021 c2.613,9.728,11.435,16.477,21.505,16.477h77.565C492.77,155.598,502.157,164.985,502.157,176.551z"></path>
                    <path style={{fill:"#7A543B"}} d="M502.157,389.016v58.752c0,11.566-9.387,20.941-20.954,20.941H30.792 c-11.567,0-20.941-9.374-20.941-20.941v-58.752H502.157z"></path>
                    <circle style={{fill:"#4D4D4D"}} cx="255.999" cy="304.602" r="118.153"></circle>
                    <circle style={{fill:"#999999"}} cx="300.414" cy="256.367" r="19.693"></circle>
                    <rect x="34.424" y="119.879" style={{fill:"#4D4D4D"}} width="64.725" height="35.724"></rect>
                    <circle style={{fill:"#333333"}} cx="255.999" cy="304.602" r="28.425"></circle>
                    <rect x="282.099" y="121.192" style={{fill:"#6BD0E8"}} width="65.644" height="34.411"></rect>
                    <path d="M256.001,211.214c-51.498,0-93.395,41.897-93.395,93.393c0,51.498,41.897,93.395,93.395,93.395s93.393-41.897,93.393-93.395 C349.394,253.111,307.497,211.214,256.001,211.214z M256.001,378.309c-40.639,0-73.701-33.062-73.701-73.701 c0-40.639,33.062-73.7,73.701-73.7s73.7,33.062,73.7,73.7C329.701,345.248,296.638,378.309,256.001,378.309z"></path>
                    <path d="M256.001,266.337c-21.103,0-38.272,17.169-38.272,38.271s17.169,38.272,38.272,38.272s38.271-17.169,38.271-38.272 C294.271,283.504,277.103,266.337,256.001,266.337z M256.001,323.186c-10.244,0-18.579-8.334-18.579-18.579 c0-10.244,8.334-18.577,18.579-18.577c10.244,0,18.577,8.334,18.577,18.577S266.244,323.186,256.001,323.186z"></path>
                    <path d="M282.105,111.34c-5.438,0-9.847,4.409-9.847,9.847v34.417c0,5.438,4.409,9.847,9.847,9.847h65.644 c5.438,0,9.847-4.409,9.847-9.847v-34.417c0-5.438-4.409-9.847-9.847-9.847H282.105z M337.902,145.758h-45.951v-14.724h45.951 V145.758z"></path>
                    <path d="M512,259.039c0-5.438-4.409-9.847-9.847-9.847s-9.847,4.409-9.847,9.847v120.129H359.98 C375.089,358.156,384,332.404,384,304.606c0-21.833-5.597-43.391-16.185-62.342c-2.653-4.749-8.653-6.448-13.398-3.794 c-4.747,2.652-6.446,8.651-3.794,13.398c8.951,16.024,13.683,34.26,13.683,52.739c0,59.721-48.586,108.308-108.308,108.308 S147.69,364.328,147.69,304.606c0-59.72,48.586-108.306,108.308-108.306c28.929,0,56.127,11.266,76.584,31.722 c3.845,3.845,10.08,3.845,13.924,0c3.845-3.845,3.845-10.08,0-13.924c-24.175-24.177-56.319-37.491-90.509-37.491 c-70.579,0-128.001,57.42-128.001,128c0,27.798,8.912,53.55,24.021,74.561h-82.6c-5.438,0-9.847,4.409-9.847,9.847 c0,5.438,4.409,9.847,9.847,9.847h100.075c22.798,20.942,53.185,33.746,86.509,33.746s63.71-12.805,86.509-33.746h149.799v48.904 c0,6.119-4.978,11.099-11.099,11.099H30.792c-6.121,0-11.099-4.978-11.099-11.099v-48.904h16.902c5.438,0,9.847-4.409,9.847-9.847 c0-5.438-4.409-9.847-9.847-9.847H19.693V176.549c0-6.119,4.978-11.099,11.099-11.099h77.565c14.494,0,27.249-9.774,31.018-23.768 l8.626-32.019c1.459-5.416,6.395-9.197,12.005-9.197h191.986c5.609,0,10.545,3.782,12.004,9.198l8.626,32.017 c3.771,13.995,16.525,23.768,31.02,23.768h77.565c6.119,0,11.099,4.978,11.099,11.099v49.668c0,5.438,4.409,9.847,9.847,9.847 s9.847-4.409,9.847-9.847v-49.668c0-16.978-13.813-30.792-30.792-30.792h-77.565c-5.609,0-10.545-3.782-12.005-9.198l-8.626-32.019 c-3.771-13.994-16.525-23.768-31.018-23.768H160.008c-14.494,0-27.249,9.773-31.02,23.768l-8.626,32.019 c-1.402,5.206-6.021,8.892-11.358,9.171v-25.855c0-5.438-4.409-9.847-9.847-9.847H34.426c-5.438,0-9.847,4.409-9.847,9.847v26.514 C10.569,149.27,0,161.699,0,176.549v271.217c0,16.978,13.813,30.792,30.792,30.792h450.415c16.978,0,30.792-13.813,30.792-30.792 L512,259.039L512,259.039z M44.273,129.721h45.039v16.037H44.273V129.721z"></path>
                    <path d="M170.51,128.548c-5.438,0-9.847,4.409-9.847,9.847c0,5.438,4.409,9.847,9.847,9.847h61.706c5.438,0,9.847-4.409,9.847-9.847 c0-5.438-4.409-9.847-9.847-9.847H170.51z"></path>
                    <path d="M400.702,81.144c5.438,0,9.847-4.409,9.847-9.847V43.288c0-5.438-4.409-9.847-9.847-9.847s-9.847,4.409-9.847,9.847v28.008 C390.855,76.735,395.264,81.144,400.702,81.144z"></path>
                    <path d="M434.122,94.987c2.519,0,5.04-0.961,6.962-2.884l19.805-19.805c3.845-3.845,3.845-10.08,0-13.924 c-3.845-3.845-10.08-3.845-13.924,0L427.16,78.178c-3.845,3.845-3.845,10.08,0,13.924C429.082,94.025,431.603,94.987,434.122,94.987 z"></path>
                    <path d="M438.119,118.561c0,5.438,4.409,9.847,9.847,9.847h28.008c5.438,0,9.847-4.409,9.847-9.847s-4.409-9.847-9.847-9.847 h-28.008C442.527,108.715,438.119,113.123,438.119,118.561z"></path>
                  </svg>
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
