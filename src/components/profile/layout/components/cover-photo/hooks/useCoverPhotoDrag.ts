import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useCover } from '@/hooks/media/useCover';
import { useAuth } from '@/contexts/AuthContext';

export const useCoverPhotoDrag = () => {
  const { user } = useAuth();
  const { position, updatePosition, isPositionChanging, isPositionSaving } = useCover(user?.id);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialY, setInitialY] = useState(50);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [buttonColor, setButtonColor] = useState('rgba(255, 255, 255, 0.1)');
  const [originalButtonColor, setOriginalButtonColor] = useState('rgba(255, 255, 255, 0.1)');
  const coverRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const lastMouseYRef = useRef(0);
  
  // Extract Y percentage from position string
  const getCurrentY = useCallback(() => {
    const match = /center\s+(-?\d+(?:\.\d+)?)%/.exec(position);
    return match ? parseFloat(match[1]) : 50;
  }, [position]);
  
  const currentY = getCurrentY();
  const userId = user?.id;

  // Simplified position application - no complex DOM watching
  const applyPositionToDOM = useCallback((positionStr: string) => {
    const target = coverRef.current;
    if (!target) return;
    
    // Apply position smoothly without transitions during drag
    if (isDragging) {
      target.style.transition = 'none';
      target.style.backgroundPosition = positionStr;
    } else {
      target.style.transition = 'background-position 0.3s ease';
      target.style.backgroundPosition = positionStr;
    }
  }, [isDragging]);

  // Apply position to DOM when position changes from useCover
  useEffect(() => {
    applyPositionToDOM(position);
  }, [position, applyPositionToDOM]);

  // Initialize drag Y from current position
  useEffect(() => {
    setInitialY(currentY);
  }, [currentY]);

  // Drag handlers
  const handleDragModeToggle = () => {
    if (!isPositionChanging) {
      setIsDragMode(true);
      setHasUnsavedChanges(false);
      setOriginalButtonColor(buttonColor);
      toast.info("Drag mode activated!");
    }
  };

  const handleCancelChanges = () => {
    setIsDragMode(false);
    setIsDragging(false);
    setDragStart(null);
    setHasUnsavedChanges(false);
    setButtonColor(originalButtonColor);
    
    // Reset to original position (current position from useCover)
    toast.info("Changes cancelled");
  };

  const handleButtonColorChange = (color: string) => {
    setButtonColor(color);
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!userId || !hasUnsavedChanges) {
      setIsDragMode(false);
      setIsDragging(false);
      setDragStart(null);
      return;
    }
    
    const positionToSave = `center ${currentY}%`;
    
    try {
      const success = await updatePosition(positionToSave, true);
      
      if (success) {
        setHasUnsavedChanges(false);
        toast.success('Position saved!');
      } else {
        toast.error('Failed to save position');
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save');
    } finally {
      setIsDragMode(false);
      setIsDragging(false);
      setDragStart(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDragMode || isPositionChanging) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setInitialY(currentY);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    lastMouseYRef.current = e.clientY;
    
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = () => {};

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      document.body.style.userSelect = '';
      
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    }
  };

  // Global drag handling
  useEffect(() => {
    if (!isDragging || !dragStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      lastMouseYRef.current = e.clientY;
      
      if (rafId.current) return;
      
      rafId.current = requestAnimationFrame(() => {
        if (!isDragging || !dragStart || !coverRef.current) {
          rafId.current = null;
          return;
        }
        
        const deltaY = lastMouseYRef.current - dragStart.y;
        const sensitivity = 0.15;
        const newY = Math.max(0, Math.min(100, initialY - (deltaY * sensitivity)));
        
        if (Math.abs(newY - currentY) > 0.1) {
          const newPosition = `center ${newY}%`;
          setHasUnsavedChanges(Math.abs(newY - initialY) > 0.5);
          
          // Update position immediately via useCover (optimistic update)
          updatePosition(newPosition, false);
        }
        
        rafId.current = null;
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
      document.body.style.userSelect = '';
      
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, initialY, currentY, userId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      document.body.style.userSelect = '';
    };
  }, []);

  return {
    isDragging,
    isDragMode,
    isSaving: isPositionSaving,
    hasUnsavedChanges,
    coverRef,
    buttonColor,
    handleDragModeToggle,
    handleSaveChanges,
    handleCancelChanges,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleButtonColorChange
  };
};