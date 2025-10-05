import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '@/components/Avatar';
import { useUniversalUser } from '@/hooks/useUniversalUser';
import { useGlobalCoverPhoto } from '@/hooks/useGlobalCoverPhoto';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useProfileSettings } from '@/hooks/useProfileSettings';
import CoverPhotoOverlay from './CoverPhotoOverlay';
import CoverPhotoControls from './CoverPhotoControls';

import { useGlobalAvatar } from '@/hooks/useGlobalAvatar';
import LoadingDots from '@/components/ui/LoadingDots';
import { toast } from 'sonner';
import UploadAnimation from '@/components/ui/UploadAnimation';
import CoverUploadAnimation from '@/components/ui/CoverUploadAnimation';
import { useCover } from '@/hooks/media/useCover';
import { mediaService } from '@/services/media/MediaService';

interface CoverPhotoContentProps {
  coverPhotoUrl: string;
  isDragMode: boolean;
  isDragging: boolean;
  isSaving?: boolean;
  coverRef: React.RefObject<HTMLDivElement>;
  buttonColor: string;
  onDragModeToggle: () => void;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
  onEditCoverClick: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onButtonColorChange: (color: string) => void;
  showProfileInfo?: boolean;
  containerClassName?: string;
}

const CoverPhotoContent: React.FC<CoverPhotoContentProps> = ({
  coverPhotoUrl,
  isDragMode,
  isDragging,
  isSaving,
  coverRef,
  buttonColor,
  onDragModeToggle,
  onSaveChanges,
  onCancelChanges,
  onEditCoverClick,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onButtonColorChange,
  showProfileInfo = true,
  containerClassName
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { displayName, role: userRole } = useUniversalUser(); // Get role from universal user
  const { userRole: contextRole } = useUserRole(); // Backup from context
  const { uploadAvatar, isLoading: avatarUploading, uploadProgress: avatarProgress } = useGlobalAvatar();
  const { userInfo } = useProfileSettings();
  const { coverPhotoUrl: globalCoverUrl, coverPosition, coverGradient, isLoading: coverLoading } = useGlobalCoverPhoto();
  const { resolvedUrl, lastGoodUrl, position: coverPositionV2, loading: coverLoadingV2 } = useCover();

  // Debug banner for resolver failures (enabled via ?coverDebug=1)
  const showDebug = (() => { try { const p = new URLSearchParams(window.location.search); return p.get('coverDebug') === '1'; } catch { return false; } })();
  const [resolverDown, setResolverDown] = useState(false);
  useEffect(() => {
    const handler = () => {
      setResolverDown(true);
      // Auto-hide after 10s
      const t = setTimeout(() => setResolverDown(false), 10000);
      return () => clearTimeout(t);
    };
    window.addEventListener('media-resolve-failed', handler);
    return () => window.removeEventListener('media-resolve-failed', handler);
  }, []);

  // Local avatar upload from profile header
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const triggerAvatarInput = () => avatarFileInputRef.current?.click();
  const handleAvatarFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    try {
      if (!file) return;
      if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
        toast.error('Unsupported format. Please use JPEG, PNG, or WEBP.');
        return;
      }
      await uploadAvatar(file);
      toast.success('Profile photo updated');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update profile photo';
      toast.error(msg);
      console.error('Avatar upload error:', e);
    } finally {
      if (event.target) event.target.value = '';
    }
  };
  // Separate upload state from general loading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Simulated progress for cover upload - only during actual uploads
  useEffect(() => {
    if (isUploading) {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 500);
    }
  }, [isUploading]);

  // Listen for upload events from cover hooks
  useEffect(() => {
    const handleUploadStart = () => setIsUploading(true);
    const handleUploadEnd = () => setIsUploading(false);
    
    // Listen to custom events from cover hooks
    window.addEventListener('cover-upload-start', handleUploadStart);
    window.addEventListener('cover-upload-end', handleUploadEnd);
    
    return () => {
      window.removeEventListener('cover-upload-start', handleUploadStart);
      window.removeEventListener('cover-upload-end', handleUploadEnd);
    };
  }, []);

  // Prefer full name from profile cache/auth, fallback to universal displayName; never blank
  const profileDisplayName = (() => {
    const fullFromProfile = [userInfo?.first_name, userInfo?.last_name].filter(Boolean).join(' ').trim();
    if (fullFromProfile) return fullFromProfile;
    const meta = (user as any)?.user_metadata || {};
    const fullFromAuth = [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim();
    if (fullFromAuth) return fullFromAuth;
    if (displayName) return displayName;
    return '';
  })();

  // Get display role (use universal user role or fallback to context role)
  const displayRole = userRole || contextRole || 'user';
  
  // Format role for display
  const formatRole = (role: string) => {
    const roleMap: Record<string, string> = {
      'user': 'User',
      'moderator': 'Moderator',
      'admin': 'Admin',
      'super_admin': 'Super Admin',
      'platform_owner_root': 'Platform Owner'
    };
    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Choose best candidate: resolved -> lastGood -> cached(localStorage) -> global -> prop
  const cachedLast = (() => {
    try {
      const id = user?.id;
      if (!id) return null;
      const raw = localStorage.getItem(`cover:last:${id}`);
      if (!raw) return null;
      const j = JSON.parse(raw);
      return typeof j?.url === 'string' ? j.url : null;
    } catch { return null; }
  })();
  const baseCandidate = resolvedUrl || lastGoodUrl || cachedLast || globalCoverUrl || coverPhotoUrl || null;
  
  // Initialize with any direct URL immediately to prevent initial flicker
  const [displayUrl, setDisplayUrl] = useState<string | null>(() => {
    const input = baseCandidate;
    if (!input) return null;
    return /^(https?:|blob:|data:)/.test(input) ? input : null;
  });

  useEffect(() => {
    let cancelled = false;
    const input = baseCandidate;
    if (!input) {
      setDisplayUrl(null);
      return;
    }
    const isDirect = /^(https?:|blob:|data:)/.test(input);
    if (isDirect) {
      setDisplayUrl(input);
      return;
    }
    mediaService
      .getUrl(input)
      .then((url) => {
        if (!cancelled) setDisplayUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDisplayUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [baseCandidate]);
  
  // Debug logging
  console.log('🖼️ Cover Photo Debug:', { 
    globalCoverUrl,
    resolvedUrl,
    baseCandidate,
    displayUrl,
    coverPositionGlobal: coverPosition,
    coverPositionV2,
    effectivePosition: coverPositionV2 || coverPosition,
    coverLoadingCombined: coverLoading || coverLoadingV2
  });

  // Keep DOM position in sync via style prop only to avoid double writes
  useEffect(() => {
    // no-op: backgroundPosition is controlled by style with lastPositionRef
  }, [coverPosition]);

  // Refresh avatar data when user metadata changes (name updates)
  useEffect(() => {
    if (user?.user_metadata?.first_name || user?.user_metadata?.last_name) {
      // No refresh needed with global system
    }
  }, [user?.user_metadata?.first_name, user?.user_metadata?.last_name]);

  const handleCoverMouseDown = (e: React.MouseEvent) => {
    // Only handle mouse down for dragging if in drag mode and not clicking on controls
    if (isDragMode && e.target === e.currentTarget) {
      onMouseDown(e);
    }
  };

  // Normalize to vertical-only (force X to center)
  const normalizePosition = (pos?: string | null) => {
    if (!pos) return 'center center';
    const parts = pos.trim().split(/\s+/);
    const y = parts[1] ?? parts[0] ?? '50%';
    return `center ${y}`;
  };
  const effectivePosition = coverPositionV2 || coverPosition;
  const normalizedPosition = normalizePosition(effectivePosition);
  // Persist last applied position to avoid resets on remounts
  const lastPositionRef = useRef<string>(normalizedPosition);
  useEffect(() => {
    if (normalizedPosition) lastPositionRef.current = normalizedPosition;
  }, [normalizedPosition]);
  return (
    <div 
      ref={coverRef}
      className={`p-4 rounded-b-xl relative mx-auto overflow-hidden border border-border shadow-sm bg-muted ${containerClassName ?? 'h-[500px] max-w-[1200px] w-full'}`}
      style={{
        ...(displayUrl ? { backgroundImage: `url(${displayUrl})` } : {}),
        backgroundSize: 'cover',
        backgroundPosition: lastPositionRef.current,
        backgroundRepeat: 'no-repeat',
        cursor: isDragMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
        transition: isDragging ? 'none' : 'cursor 0.2s ease'
      }}
      onMouseDown={handleCoverMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {showDebug && resolverDown && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 rounded-md border bg-background/90 backdrop-blur px-3 py-1 text-xs shadow">
          Media resolver failed; using fallback if available
        </div>
      )}
      <CoverPhotoOverlay isDragMode={isDragMode} />
      
      {/* Custom Cover Upload Animation - Full Screen Overlay */}
      <CoverUploadAnimation 
        isUploading={isUploading} 
        progress={uploadProgress} 
      />

      {/* Saving overlay when reposition is being saved */}
      {isSaving && (
        <LoadingDots message="Saving changes..." variant="light" size="md" />
      )}

      <CoverPhotoControls
        isDragMode={isDragMode}
        isSaving={isSaving ?? false}
        buttonColor={buttonColor}
        onDragModeToggle={onDragModeToggle}
        onSaveChanges={onSaveChanges}
        onCancelChanges={onCancelChanges}
        onEditCoverClick={onEditCoverClick}
        onMouseDown={onMouseDown}
        onButtonColorChange={onButtonColorChange}
      />

      {/* Profile Picture - positioned at bottom left with upload animation */}
      <div className="absolute bottom-4 left-4">
        <UploadAnimation
          isUploading={avatarUploading}
          progress={avatarProgress || 0}
          type="avatar"
        >
          <div 
            className="relative cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label="Change profile photo"
            onClick={(e) => {
              e.stopPropagation();
              triggerAvatarInput();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerAvatarInput();
              }
            }}
          >
            <Avatar 
              size="xl"
              className="w-40 h-40 shadow-lg rounded-full"
            />
            {/* Hover camera overlay */}
            <div 
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-20"
              role="button"
              tabIndex={0}
              aria-label="Change profile photo"
              onClick={(e) => {
                e.stopPropagation();
                triggerAvatarInput();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  triggerAvatarInput();
                }
              }}
            >
              {/* Custom camera add icon */}
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white">
                <g>
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 10.25C12.4142 10.25 12.75 10.5858 12.75 11V12.25H14C14.4142 12.25 14.75 12.5858 14.75 13C14.75 13.4142 14.4142 13.75 14 13.75H12.75V15C12.75 15.4142 12.4142 15.75 12 15.75C11.5858 15.75 11.25 15.4142 11.25 15V13.75H10C9.58579 13.75 9.25 13.4142 9.25 13C9.25 12.5858 9.58579 12.25 10 12.25H11.25V11C11.25 10.5858 11.5858 10.25 12 10.25Z" fill="currentColor"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M9.77778 21H14.2222C17.3433 21 18.9038 21 20.0248 20.2646C20.51 19.9462 20.9267 19.5371 21.251 19.0607C22 17.9601 22 16.4279 22 13.3636C22 10.2994 22 8.76721 21.251 7.6666C20.9267 7.19014 20.51 6.78104 20.0248 6.46268C19.3044 5.99013 18.4027 5.82123 17.022 5.76086C16.3631 5.76086 15.7959 5.27068 15.6667 4.63636C15.4728 3.68489 14.6219 3 13.6337 3H10.3663C9.37805 3 8.52715 3.68489 8.33333 4.63636C8.20412 5.27068 7.63685 5.76086 6.978 5.76086C5.59733 5.82123 4.69555 5.99013 3.97524 6.46268C3.48995 6.78104 3.07328 7.19014 2.74902 7.6666C2 8.76721 2 10.2994 2 13.3636C2 16.4279 2 17.9601 2.74902 19.0607C3.07328 19.5371 3.48995 19.9462 3.97524 20.2646C5.09624 21 6.65675 21 9.77778 21ZM16 13C16 15.2091 14.2091 17 12 17C9.79086 17 8 15.2091 8 13C8 10.7909 9.79086 9 12 9C14.2091 9 16 10.7909 16 13ZM18 9.25C17.5858 9.25 17.25 9.58579 17.25 10C17.25 10.4142 17.5858 10.75 18 10.75H19C19.4142 10.75 19.75 10.4142 19.75 10C19.75 9.58579 19.4142 9.25 19 9.25H18Z" fill="currentColor"/>
                </g>
              </svg>
            </div>
          </div>
        </UploadAnimation>
        {/* Hidden file input for avatar upload */}
        <input 
          ref={avatarFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarFileUpload}
          className="hidden"
        />
      </div>

      {/* User Info - positioned on the right side next to profile picture */}
      {showProfileInfo && profileDisplayName && (
        <div className="absolute bottom-8 left-48 pt-4">
          <h1 className="font-bold text-white mb-1 text-3xl drop-shadow-lg">
            {profileDisplayName}
          </h1>
          <button 
            onClick={() => navigate('/professional-presentation')}
            className="mt-2 px-4 py-1.5 border border-white/30 text-white backdrop-blur-sm rounded-md transition-all duration-200 text-sm font-medium flex items-center gap-2 hover:bg-white/20"
            style={{ backgroundColor: buttonColor }}
          >
            Prezantimi profesional
            <svg fill="currentColor" height="16" width="16" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" transform="rotate(-45)" className="flex-shrink-0">
              <g transform="translate(0 1)">
                <g>
                  <g>
                    <path d="M392.425,212.333c-7.68,0-15.36,2.56-21.333,7.68v-7.68c0-11.093-5.12-23.04-13.653-31.573 c-6.827-6.827-15.36-11.093-24.747-11.093c-7.68,0-15.36,2.56-21.333,7.68c-0.853-11.093-5.12-22.187-13.653-30.72 c-6.827-6.827-15.36-11.093-24.747-11.093c-7.68,0-15.36,2.56-21.333,7.68v-33.28c0-20.48-16.213-42.667-38.4-42.667 c-22.187,0-38.4,22.187-38.4,42.667v128.853c-7.68-16.213-17.92-31.573-28.16-41.813c-13.653-13.653-40.96-14.507-56.32-1.707 c-4.267,4.267-18.773,19.627,0.853,46.933c17.92,24.747,26.453,76.8,31.573,107.52l1.707,8.533 c11.093,64,45.227,84.48,59.733,90.453v53.76c0,5.12,3.413,8.533,8.533,8.533s8.533-3.413,8.533-8.533v-59.733 c0-4.267-2.56-7.68-6.827-8.533c-1.707-0.853-40.96-10.24-52.907-78.507l-1.707-8.533c-5.973-34.987-14.507-87.04-34.133-114.347 c-5.973-7.68-11.093-17.92-3.413-23.893c8.533-6.827,25.6-6.827,33.28,0.853c21.333,21.333,40.107,66.56,40.107,87.893 c0,5.12,3.413,8.533,8.533,8.533s8.533-3.413,8.533-8.533V109.933c0-11.947,9.387-25.6,21.333-25.6s21.333,13.653,21.333,25.6 v67.413v0.853v85.333c0,5.12,3.413,8.533,8.533,8.533s8.533-3.413,8.533-8.533v-86.187c0.853-11.093,9.387-24.747,21.333-24.747 c4.267,0,8.533,1.707,12.8,5.973c5.12,5.12,8.533,12.8,8.533,19.627v93.867c0,5.12,3.413,8.533,8.533,8.533 s8.533-3.413,8.533-8.533v-59.733c0-11.947,9.387-25.6,21.333-25.6c4.267,0,8.533,1.707,12.8,5.973 c5.12,5.12,8.533,12.8,8.533,19.627v40.107c0,0.853,0,1.707,0,2.56v17.067c0,5.12,3.413,8.533,8.533,8.533 s8.533-3.413,8.533-8.533v-18.773c0.853-11.093,10.24-23.893,21.333-23.893c11.947,0,21.333,13.653,21.333,25.6v102.4 c0,50.347,0,50.347-11.947,65.707c-3.413,3.413-6.827,8.533-11.947,14.507c-1.707,1.707-1.707,4.267-1.707,5.973v58.88 c0,5.12,3.413,8.533,8.533,8.533s8.533-3.413,7.68-8.533v-57.173c3.413-5.12,6.827-8.533,9.387-11.947 c16.213-19.627,16.213-22.187,16.213-76.8V255C430.825,234.52,414.612,212.333,392.425,212.333z"></path>
                    <path d="M218.345,50.2c5.12,0,8.533-3.413,8.533-8.533V7.533c0-5.12-3.413-8.533-8.533-8.533s-8.533,3.413-8.533,8.533v34.133 C209.812,46.787,213.225,50.2,218.345,50.2z"></path>
                    <path d="M269.545,92.867c0,5.12,3.413,8.533,8.533,8.533h34.133c5.12,0,8.533-3.413,8.533-8.533c0-5.12-3.413-8.533-8.533-8.533 h-34.133C272.958,84.333,269.545,87.747,269.545,92.867z"></path>
                    <path d="M115.945,101.4h34.133c5.12,0,8.533-3.413,8.533-8.533c0-5.12-3.413-8.533-8.533-8.533h-34.133 c-5.12,0-8.533,3.413-8.533,8.533C107.412,97.987,110.825,101.4,115.945,101.4z"></path>
                    <path d="M261.012,67.267c2.56,0,4.267-0.853,5.973-2.56l25.6-25.6c3.413-3.413,3.413-8.533,0-11.947s-8.533-3.413-11.947,0 l-25.6,25.6c-3.413,3.413-3.413,8.533,0,11.947C256.745,66.413,258.452,67.267,261.012,67.267z"></path>
                    <path d="M161.172,64.707c1.707,1.707,3.413,2.56,5.973,2.56s4.267-0.853,5.973-2.56c3.413-3.413,3.413-8.533,0-11.947l-25.6-25.6 c-3.413-3.413-8.533-3.413-11.947,0s-3.413,8.533,0,11.947L161.172,64.707z"></path>
                    <path d="M303.678,434.2c5.12,0,8.533-3.413,8.533-8.533s-3.413-8.533-8.533-8.533h-25.6c-5.12,0-8.533,3.413-8.533,8.533 s3.413,8.533,8.533,8.533H303.678z"></path>
                    <path d="M312.212,451.267h-42.667c-5.12,0-8.533,3.413-8.533,8.533c0,5.12,3.413,8.533,8.533,8.533h42.667 c5.12,0,8.533-3.413,8.533-8.533C320.745,454.68,317.332,451.267,312.212,451.267z"></path>
                  </g>
                </g>
              </g>
            </svg>
          </button>
        </div>
      )}

    </div>
  );
};

export default CoverPhotoContent;