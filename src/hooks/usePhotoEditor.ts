import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PhotoTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

interface UsePhotoEditorProps {
  userId: string | undefined;
  initialTransform?: PhotoTransform;
  onSave?: (transform: PhotoTransform) => void;
}

export const usePhotoEditor = ({ userId, initialTransform, onSave }: UsePhotoEditorProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const defaultTransform: PhotoTransform = initialTransform || { scale: 1.2, translateX: 0, translateY: 0 };
  
  // Load cached transform from localStorage IMMEDIATELY to prevent flicker
  const getCachedTransform = (): PhotoTransform => {
    if (!userId) return defaultTransform;
    try {
      const cached = localStorage.getItem(`photo-transform-${userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load cached transform', e);
    }
    return defaultTransform;
  };

  const [transform, setTransform] = useState<PhotoTransform>(getCachedTransform());
  const [isLoading, setIsLoading] = useState(true);
  const persistedRef = useRef<PhotoTransform>(getCachedTransform());
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; scale: number } | null>(null);
  const rafRef = useRef<number | null>(null);

// Load saved transform from database (but use cached version during load)
useEffect(() => {
  if (!userId) {
    setIsLoading(false);
    return;
  }

  const loadTransform = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('photo_transform')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data?.photo_transform) {
        const dbTransform = data.photo_transform as PhotoTransform;
        setTransform(dbTransform);
        persistedRef.current = dbTransform;
        // Update cache
        localStorage.setItem(`photo-transform-${userId}`, JSON.stringify(dbTransform));
      } else {
        // No saved transform, use default
        const finalTransform = getCachedTransform();
        setTransform(finalTransform);
        persistedRef.current = finalTransform;
      }
    } catch (e) {
      console.warn('Failed to load photo transform', e);
    } finally {
      setIsLoading(false);
    }
  };

  loadTransform();
}, [userId]);

  // Smooth update using RAF
  const updateTransform = useCallback((newTransform: Partial<PhotoTransform>) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      setTransform(prev => ({ ...prev, ...newTransform }));
    });
  }, []);

  // Handle dragging
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - transform.translateX,
      y: e.clientY - transform.translateY,
    };
  }, [transform]);

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;

      const translateX = e.clientX - dragStartRef.current.x;
      const translateY = e.clientY - dragStartRef.current.y;

      // Constrain movement to wide bounds for free placement
      const maxTranslate = 1200;
      const constrainedX = Math.max(-maxTranslate, Math.min(maxTranslate, translateX));
      const constrainedY = Math.max(-maxTranslate, Math.min(maxTranslate, translateY));

      updateTransform({ translateX: constrainedX, translateY: constrainedY });
    },
    [isDragging, updateTransform]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Handle resizing
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scale: transform.scale,
      };
    },
    [transform.scale]
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !resizeStartRef.current) return;

      // Calculate distance moved (diagonal for proportional scaling)
      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;
      const delta = (deltaX + deltaY) / 2;

      // Scale factor: 1px movement = 0.002 scale change
      const scaleDelta = delta * 0.002;
      const newScale = resizeStartRef.current.scale + scaleDelta;

      // Constrain scale between 0.5x and 2.5x
      const constrainedScale = Math.max(0.5, Math.min(2.5, newScale));

      updateTransform({ scale: constrainedScale });
    },
    [isResizing, updateTransform]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    resizeStartRef.current = null;
  }, []);

  // Global event listeners for drag/resize
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Save to database
  const saveTransform = useCallback(async () => {
    if (!userId) {
      toast.error('Cannot save: User not found');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ photo_transform: transform })
        .eq('id', userId);

      if (error) throw error;

      persistedRef.current = transform;
      // Cache immediately for instant load next time
      if (userId) {
        localStorage.setItem(`photo-transform-${userId}`, JSON.stringify(transform));
      }
      toast.success('Photo position saved!');
      setIsEditMode(false);
      onSave?.(transform);
    } catch (error) {
      console.error('Error saving photo transform:', error);
      toast.error('Failed to save photo position');
    } finally {
      setIsSaving(false);
    }
  }, [userId, transform, onSave]);

// Reset to default
const resetTransform = useCallback(() => {
  const base = { scale: 1.2, translateX: 0, translateY: 0 };
  setTransform(base);
  toast.info('Photo reset to default');
}, []);

// Cancel editing
const cancelEdit = useCallback(() => {
  // Revert to last saved state
  setTransform(persistedRef.current);
  setIsEditMode(false);
}, []);

  return {
    isEditMode,
    setIsEditMode,
    transform,
    isLoading,
    isDragging,
    isResizing,
    isSaving,
    handleDragStart,
    handleResizeStart,
    saveTransform,
    resetTransform,
    cancelEdit,
  };
};
