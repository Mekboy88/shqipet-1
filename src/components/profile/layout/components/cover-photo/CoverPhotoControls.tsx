
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

interface CoverPhotoControlsProps {
  isDragMode: boolean;
  isSaving?: boolean;
  buttonColor: string;
  onDragModeToggle: () => void;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
  onEditCoverClick: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onButtonColorChange: (color: string) => void;
}

const CoverPhotoControls: React.FC<CoverPhotoControlsProps> = ({
  isDragMode,
  isSaving = false,
  buttonColor,
  onDragModeToggle,
  onSaveChanges,
  onCancelChanges,
  onEditCoverClick,
  onMouseDown,
  onButtonColorChange
}) => {
  const colorOptions = [
    { name: 'White (transparent)', value: 'rgba(255, 255, 255, 0.1)' },
    { name: 'Dark', value: 'rgba(0, 0, 0, 0.5)' },
    { name: 'Blue', value: 'rgba(59, 130, 246, 0.7)' },
    { name: 'Green', value: 'rgba(34, 197, 94, 0.7)' },
    { name: 'Red', value: 'rgba(239, 68, 68, 0.7)' },
    { name: 'Purple', value: 'rgba(168, 85, 247, 0.7)' },
  ];
  const handleDragModeToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragModeToggle();
  };

  const handleEditCoverClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEditCoverClick();
  };

  const handleSaveChanges = (e: React.MouseEvent) => {
    console.log('🔄 Save button clicked!', { onSaveChanges: !!onSaveChanges });
    e.preventDefault();
    e.stopPropagation();
    onSaveChanges();
  };

  const handleCancelChanges = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCancelChanges();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onMouseDown(e);
  };

  return (
    <div 
      className="absolute bottom-4 right-4 flex gap-2"
      onClick={(e) => e.stopPropagation()} // Prevent cover photo click when clicking anywhere in this area
    >
      {/* Move/Expand Icon */}
      {!isDragMode ? (
        <div 
          className="bg-black bg-opacity-30 rounded-lg p-3 cursor-pointer hover:bg-opacity-50 transition-all duration-200 flex items-center gap-2"
          onClick={handleDragModeToggle}
        >
          <svg viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="#000000" className="w-6 h-6">
            <g>
              <path fill="#e6e6e6" d="M16 8l-3-3v2h-4v-4h2l-3-3-3 3h2v4h-4v-2l-3 3 3 3v-2h4v4h-2l3 3 3-3h-2v-4h4v2z"></path>
            </g>
          </svg>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {/* Color Picker for Button */}
          <div className="bg-black bg-opacity-50 rounded-lg p-2 flex items-center gap-2">
            <span className="text-white text-xs font-medium">Ngjyra e butonit:</span>
            <div className="flex gap-1">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onButtonColorChange(option.value)}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    buttonColor === option.value ? 'border-white scale-110' : 'border-white/30 hover:border-white/60'
                  }`}
                  style={{ backgroundColor: option.value }}
                  title={option.name}
                />
              ))}
            </div>
          </div>

          {/* Active Drag Icon */}
          <div 
            className="bg-blue-600 bg-opacity-80 rounded-lg p-3 cursor-grab hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2"
            onMouseDown={handleMouseDown}
          >
            <svg viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="#000000" className="w-6 h-6">
              <g>
                <path fill="#ffffff" d="M16 8l-3-3v2h-4v-4h2l-3-3-3 3h2v4h-4v-2l-3 3 3 3v-2h4v4h-2l3 3 3-3h-2v-4h4v2z"></path>
              </g>
            </svg>
            <span className="text-white text-sm font-medium">Zvarrit për të rregulluar</span>
          </div>
          
          {/* Save Changes Button */}
          <Button 
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving}
            aria-busy={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Duke ruajtur…' : 'Ruaj ndryshimet'}
          </Button>

          {/* Cancel Changes Button */}
          <Button 
            type="button"
            onClick={handleCancelChanges}
            disabled={isSaving}
            variant="outline"
            className="bg-red-600 hover:bg-red-700 text-white border-red-600 px-3 py-2 rounded-lg flex items-center gap-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Edit Icon - Only show when not in drag mode */}
      {!isDragMode && (
        <div 
          className="bg-black bg-opacity-30 rounded-lg p-3 cursor-pointer hover:bg-opacity-50 transition-all duration-200" 
          onClick={handleEditCoverClick}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
            <g>
              <path d="M7 11C8.10457 11 9 10.1046 9 9C9 7.89543 8.10457 7 7 7C5.89543 7 5 7.89543 5 9C5 10.1046 5.89543 11 7 11Z" stroke="#e6e6e6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M5.56055 21C11.1305 11.1 15.7605 9.35991 21.0005 15.7899" stroke="#e6e6e6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M14.35 3H5C3.93913 3 2.92172 3.42136 2.17157 4.17151C1.42142 4.92165 1 5.93913 1 7V17C1 18.0609 1.42142 19.0782 2.17157 19.8284C2.92172 20.5785 3.93913 21 5 21H17C18.0609 21 19.0783 20.5785 19.8284 19.8284C20.5786 19.0782 21 18.0609 21 17V9" stroke="#e6e6e6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M22.3098 3.16996L17.2098 8.26005C16.7098 8.77005 15.2098 8.99996 14.8698 8.66996C14.5298 8.33996 14.7598 6.82999 15.2698 6.31999L20.3599 1.23002C20.6171 0.964804 20.9692 0.812673 21.3386 0.807047C21.7081 0.80142 22.0646 0.942731 22.3298 1.19999C22.5951 1.45725 22.7472 1.8093 22.7529 2.17875C22.7585 2.5482 22.6171 2.90475 22.3599 3.16996H22.3098Z" stroke="#e6e6e6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            </g>
          </svg>
        </div>
      )}
    </div>
  );
};

export default CoverPhotoControls;
