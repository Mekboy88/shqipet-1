import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Translate {
  translateX: number;
  translateY: number;
}

interface UseGroupDragProps {
  userId: string | undefined;
}

export const useGroupDrag = ({ userId }: UseGroupDragProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transform, setTransform] = useState<Translate>({ translateX: 0, translateY: 0 });
  const persistedRef = useRef<Translate>({ translateX: 0, translateY: 0 });
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Load saved transform
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('photo_text_transform')
        .eq('id', userId)
        .maybeSingle();
      if (!error && data?.photo_text_transform) {
        setTransform(data.photo_text_transform as Translate);
        persistedRef.current = data.photo_text_transform as Translate;
      }
    })();
  }, [userId]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - transform.translateX,
      y: e.clientY - transform.translateY,
    };
  }, [transform]);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const translateX = e.clientX - dragStartRef.current.x;
    const translateY = e.clientY - dragStartRef.current.y;
    const max = 2000;
    setTransform({
      translateX: Math.max(-max, Math.min(max, translateX)),
      translateY: Math.max(-max, Math.min(max, translateY)),
    });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const save = useCallback(async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ photo_text_transform: transform })
        .eq('id', userId);
      if (error) throw error;
      persistedRef.current = transform;
      toast.success('Text position saved');
      setIsEditMode(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to save text position');
    } finally {
      setIsSaving(false);
    }
  }, [userId, transform]);

  const cancel = useCallback(() => {
    setTransform(persistedRef.current);
    setIsEditMode(false);
  }, []);

  const reset = useCallback(() => {
    setTransform({ translateX: 0, translateY: 0 });
  }, []);

  return {
    isEditMode,
    setIsEditMode,
    isDragging,
    isSaving,
    transform,
    handleDragStart,
    save,
    cancel,
    reset,
  };
};
