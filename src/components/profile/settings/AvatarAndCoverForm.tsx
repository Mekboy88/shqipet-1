/**
 * AvatarAndCoverForm – fixed persistence + smooth loading (Vite version)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useGlobalCoverPhoto } from '@/hooks/useGlobalCoverPhoto';
import { useCoverPhotoDrag } from '@/components/profile/layout/components/cover-photo/hooks/useCoverPhotoDrag';
import CoverPhotoContent from '@/components/profile/layout/components/cover-photo/CoverPhotoContent';
import { useGlobalAvatar } from '@/hooks/useGlobalAvatar';
import UploadAnimation from '@/components/ui/UploadAnimation';
import CoverUploadAnimation from '@/components/ui/CoverUploadAnimation';
import { useCover } from '@/hooks/media/useCover';
import {
  Avatar as UIAvatar,
  AvatarImage as UIAvatarImage,
  AvatarFallback as UIAvatarFallback,
} from '@/components/ui/avatar';

import { supabase } from '@/integrations/supabase/client';
import { mediaService } from '@/services/media/MediaService';

/* --------------------------- helpers & utilities -------------------------- */

// SUPABASE_URL not needed here; mediaService handles URL resolution

// Proxy URL removed; using mediaService.getUrl for keys

function extractKeyFromAnyUrl(u?: string | null): string | null {
  if (!u) return null;
  // never treat blob/data/http(s) as keys
  if (/^(blob:|data:|https?:)/.test(u)) return null;
  try {
    const url = new URL(u);
    const k = url.searchParams.get('key');
    if (k) return k;
    if (url.hostname.includes('wasabisys.com')) {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) return parts.slice(1).join('/');
    }
  } catch {
    // If it's not a full URL and not a known scheme, assume it's a Wasabi key
    return u;
  }
  return null;
}

function useSmoothProgress(active: boolean) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = t - last;
      last = t;
      setProgress((p) => Math.min(90, p + (p < 70 ? dt * 0.12 : dt * 0.05)));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const finish = () => {
    setProgress(100);
    setTimeout(() => setProgress(0), 350);
  };
  return { progress: Math.round(progress), finish };
}

/* --------------------------------- main ---------------------------------- */

const AvatarAndCoverForm: React.FC = () => {
  const {
    coverPhotoUrl: globalCoverUrl,
    coverPosition,
    isLoading: globalCoverLoading,
  } = useGlobalCoverPhoto();

const { resolvedUrl: coverResolvedUrl, updateCover: updateCoverV2, refresh: refreshCoverV2 } = useCover();

  const {
    avatarUrl,
    uploadAvatar,
    isLoading: avatarLoading,
    uploadProgress: avatarProgress,
  } = useGlobalAvatar();

  const {
    isDragging,
    isDragMode,
    isSaving,
    coverRef,
    buttonColor,
    handleDragModeToggle,
    handleSaveChanges,
    handleCancelChanges,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleButtonColorChange
  } = useCoverPhotoDrag();

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const triggerAvatarInput = () => avatarFileInputRef.current?.click();
  const triggerCoverInput = () => coverFileInputRef.current?.click();

  const [coverUploading, setCoverUploading] = useState(false);
  const { progress: coverProgress, finish: finishCoverProgress } = useSmoothProgress(coverUploading);

  // Listen for upload events to show custom animation
  useEffect(() => {
    const handleUploadStart = () => setCoverUploading(true);
    const handleUploadEnd = () => setCoverUploading(false);
    
    window.addEventListener('cover-upload-start', handleUploadStart);
    window.addEventListener('cover-upload-end', handleUploadEnd);
    
    return () => {
      window.removeEventListener('cover-upload-start', handleUploadStart);
      window.removeEventListener('cover-upload-end', handleUploadEnd);
    };
  }, []);

  const [displayedUrl, setDisplayedUrl] = useState<string>('');

// coverKey no longer needed; display URL resolves directly via mediaService


useEffect(() => {
    const candidate = coverResolvedUrl || globalCoverUrl || null;
    if (!candidate) { setDisplayedUrl(''); return; }
    const isDirect = /^(https?:|blob:|data:)/.test(candidate);
    if (isDirect) { setDisplayedUrl(candidate); return; }
    let cancelled = false;
    const key = extractKeyFromAnyUrl(candidate) || candidate;
    mediaService.getUrl(key)
      .then((url) => { if (!cancelled) setDisplayedUrl(url); })
      .catch(() => { if (!cancelled) setDisplayedUrl(''); });
    return () => { cancelled = true; };
  }, [globalCoverUrl, coverResolvedUrl]);

  useEffect(() => {
    if (coverRef.current && coverPosition) {
      coverRef.current.style.backgroundPosition = coverPosition;
    }
  }, [coverPosition, coverRef]);

  function normalizeUploadResultToKey(result: any, fallbackUrl?: string | null): string {
    if (!result && fallbackUrl) {
      const k = extractKeyFromAnyUrl(fallbackUrl);
      if (k) return k;
    }
    if (typeof result === 'string') return extractKeyFromAnyUrl(result) || result;
    if (result?.key) return result.key;
    if (result?.fileKey) return result.fileKey;
    if (result?.url) {
      const k = extractKeyFromAnyUrl(result.url);
      if (k) return k;
    }
    if (fallbackUrl) {
      const k = extractKeyFromAnyUrl(fallbackUrl);
      if (k) return k;
    }
    throw new Error('Could not determine cover_key from upload result');
  }

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar(file);
      toast.success('Profile photo updated successfully');
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error('Failed to upload profile photo');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Use unified cover hook which handles persistence internally
      const result = await updateCoverV2(file);

      // Resolve key just for optimistic display
      const newKey = normalizeUploadResultToKey(result, coverResolvedUrl || globalCoverUrl);

      // Optimistic show (the hook already persisted the key)
      const url = await mediaService.getUrl(newKey);
      const img = new Image();
      img.src = url;
      img.onload = () => setDisplayedUrl(url);
      setDisplayedUrl(url);

      // Refresh hook state
      try { await refreshCoverV2?.(); } catch {}

      toast.success('Cover photo updated successfully');
    } catch (err: any) {
      console.error('Cover upload error:', err);
      toast.error(err?.message || 'Failed to upload cover photo');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleCoverMouseDown = (ev: React.MouseEvent) => {
    if (isDragMode && ev.target === ev.currentTarget) handleMouseDown(ev);
  };

  const isCoverLoading = coverUploading;

  return (
    <div className="space-y-6 p-6">
      {/* Custom Cover Upload Animation - Full Screen Overlay */}
      <CoverUploadAnimation 
        isUploading={isCoverLoading} 
        progress={isCoverLoading ? coverProgress : 0} 
      />
      
      <CoverPhotoContent
          coverPhotoUrl={displayedUrl || ''}
          isDragMode={isDragMode}
          isDragging={isDragging}
          isSaving={isSaving}
          coverRef={coverRef}
          buttonColor={buttonColor}
          onDragModeToggle={handleDragModeToggle}
          onSaveChanges={handleSaveChanges}
          onCancelChanges={handleCancelChanges}
          onEditCoverClick={triggerCoverInput}
          onMouseDown={handleCoverMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onButtonColorChange={handleButtonColorChange}
          showProfileInfo={false}
          containerClassName="!h-auto aspect-[12/5] w-full max-w-[1200px]"
          isOwnProfile={true}
        />


      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleAvatarFileUpload}
        className="hidden"
      />
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleCoverFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default AvatarAndCoverForm;
