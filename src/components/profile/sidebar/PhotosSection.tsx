import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { useUserPhotos } from '@/hooks/useUserPhotos';
import { useNavigate } from 'react-router-dom';

interface Photo {
  id: number;
  url: string;
}

interface PhotosSectionProps {
  photos?: Photo[]; // Made optional since we'll load from database
}

const PhotosSection: React.FC<PhotosSectionProps> = ({
  photos: propPhotos = []
}) => {
  const { getPhotosForDisplay, loading } = useUserPhotos();
  const navigate = useNavigate();
  const [displayedPhotos, setDisplayedPhotos] = useState<Photo[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const maxPhotosToDisplay = 9; // 3x3 grid

  // Use photos from database if available, otherwise use prop photos
  const photos = getPhotosForDisplay().length > 0 ? getPhotosForDisplay() : propPhotos;

  // Function to get the next batch of photos
  const getNextPhotoBatch = useCallback(() => {
    if (photos.length <= maxPhotosToDisplay) {
      return photos;
    } else {
      const startIndex = photoIndex % photos.length;
      const batch = [];
      for (let i = 0; i < maxPhotosToDisplay; i++) {
        const index = (startIndex + i) % photos.length;
        batch.push(photos[index]);
      }
      return batch;
    }
  }, [photos, photoIndex, maxPhotosToDisplay]);

  // Initialize displayed photos only when photos change
  useEffect(() => {
    if (photos.length > 0) {
      setDisplayedPhotos(getNextPhotoBatch());
    }
  }, [photos, getNextPhotoBatch]);

  // Set up rotation timer - only when we have enough photos
  useEffect(() => {
    if (photos.length <= maxPhotosToDisplay) return;
    const intervalTime = 86400000; // 24 hours in milliseconds

    const intervalId = setInterval(() => {
      setPhotoIndex(prevIndex => {
        const newIndex = (prevIndex + maxPhotosToDisplay) % photos.length;
        return newIndex;
      });
    }, intervalTime);
    return () => clearInterval(intervalId);
  }, [photos.length, maxPhotosToDisplay]);

  if (loading) {
    return (
      <Card className="p-4 shadow-sm bg-white rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Fotot</h2>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: maxPhotosToDisplay }).map((_, i) => (
            <div key={`loading-${i}`} className="aspect-square rounded-md bg-gray-200 animate-pulse"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 shadow-sm bg-white rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Fotot</h2>
          {photos.length > 0 && (
            <button 
              onClick={() => navigate('/photos/gallery')}
              className="text-blue-500 text-sm font-medium hover:underline cursor-pointer"
            >
              See All Photos
            </button>
          )}
      </div>
      
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-1">
          {displayedPhotos.map(photo => (
            <div key={photo.id} className="aspect-square rounded-md overflow-hidden">
              <img 
                src={photo.url} 
                alt={`Photo ${photo.id}`} 
                className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer" 
              />
            </div>
          ))}
          
          {/* Add empty placeholders if we have less than 9 photos */}
          {Array.from({
            length: Math.max(0, maxPhotosToDisplay - displayedPhotos.length)
          }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-md bg-gray-100"></div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No photos yet</p>
          <p className="text-sm">Upload a profile or cover photo to get started</p>
        </div>
      )}
    </Card>
  );
};

export default PhotosSection;