
import React, { useState, useMemo, useEffect } from "react";
import { X, Video, File, Play, FileText, Music, Image } from "lucide-react";
import { getFileCategory, formatFileSize } from "@/utils/contentFilter";
import UniversalPhotoGrid from "@/components/shared/UniversalPhotoGrid";

interface CreatePostFilePreviewProps {
  files: File[];
  onRemoveFile: (index: number) => void;
}

const CreatePostFilePreview: React.FC<CreatePostFilePreviewProps> = ({
  files,
  onRemoveFile
}) => {
  const [showAll, setShowAll] = useState(false);

  if (files.length === 0) return null;

  // Separate media files (photos/videos) from other files
  const mediaFiles = files.filter(file => {
    const category = getFileCategory(file);
    return category === 'image' || category === 'video';
  });

  const otherFiles = files.filter(file => {
    const category = getFileCategory(file);
    return category !== 'image' && category !== 'video';
  });

  // Create media items for UniversalPhotoGrid
  const mediaItems = useMemo(() => {
    return mediaFiles.map((file, index) => ({
      url: URL.createObjectURL(file),
      isVideo: file.type.startsWith('video/'),
      width: 1000,
      height: 1000
    }));
  }, [mediaFiles.length, mediaFiles.map(f => f.name + f.size).join(',')]);

  // Cleanup blob URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      mediaItems.forEach(item => {
        if (item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [mediaItems]);

  const displayOtherFiles = showAll ? otherFiles : otherFiles.slice(0, 4);
  const remainingOtherCount = otherFiles.length - 4;

  const getFileIcon = (file: File) => {
    const category = getFileCategory(file);
    switch (category) {
      case 'image': return <Image className="w-5 h-5 text-blue-500" />;
      case 'video': return <Video className="w-5 h-5 text-red-500" />;
      case 'audio': return <Music className="w-5 h-5 text-green-500" />;
      case 'document': return <FileText className="w-5 h-5 text-orange-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  // Find and remove media files when clicked in the grid
  const handleMediaRemove = (mediaIndex: number) => {
    const fileToRemove = mediaFiles[mediaIndex];
    const originalIndex = files.findIndex(f => f === fileToRemove);
    if (originalIndex !== -1) {
      onRemoveFile(originalIndex);
    }
  };

  return (
    <div className="relative space-y-4">
      {/* 2000 Badge */}
      <div className="absolute top-2 right-2 z-10">
        <div className="bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-primary/20">
          2000
        </div>
      </div>

      {/* Media Grid - using UniversalPhotoGrid for photos/videos */}
      {mediaFiles.length > 0 && (
        <div className="bg-gradient-to-br from-card via-card/95 to-card/90 rounded-xl border border-border/50 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-card-foreground">
              Media Preview ({mediaFiles.length} item{mediaFiles.length !== 1 ? 's' : ''})
            </h3>
          </div>
          
          <div className="rounded-lg overflow-hidden border border-border group relative">
            <UniversalPhotoGrid 
              media={mediaItems}
              onMediaClick={handleMediaRemove}
            />
            
            {/* Instructions overlay */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100 pointer-events-none">
              <div className="bg-black/60 text-white px-3 py-2 rounded-lg text-sm font-medium">
                Click to remove
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Files Grid - for non-media files */}
      {otherFiles.length > 0 && (
        <div className="bg-gradient-to-br from-card via-card/95 to-card/90 rounded-xl border border-border/50 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-card-foreground">Other Files</h3>
            {otherFiles.length > 4 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                {showAll ? 'Show Less' : `See All (${otherFiles.length})`}
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {displayOtherFiles.map((file, index) => {
              const originalIndex = files.findIndex(f => f === file);
              
              return (
                <div 
                  key={index} 
                  className="relative group bg-background/50 border border-border/30 rounded-lg overflow-hidden hover:border-primary/30 transition-all duration-200 hover:shadow-md"
                >
                  <button
                    onClick={() => onRemoveFile(originalIndex)}
                    className="absolute top-1 right-1 z-10 bg-destructive/90 text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  
                  <div className="aspect-square relative">
                    <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted/80 flex flex-col items-center justify-center p-2">
                      {getFileIcon(file)}
                      <div className="text-[10px] text-muted-foreground mt-1 text-center">
                        {file.name.split('.').pop()?.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-1.5 bg-background/80 border-t border-border/30">
                    <p className="text-[10px] text-muted-foreground truncate font-medium">
                      {file.name}
                    </p>
                    <p className="text-[9px] text-muted-foreground/70">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {!showAll && remainingOtherCount > 0 && (
              <button
                onClick={() => setShowAll(true)}
                className="aspect-square bg-gradient-to-br from-muted/50 to-muted/80 border border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center hover:from-primary/10 hover:to-primary/20 hover:border-primary/50 transition-all duration-200"
              >
                <div className="text-2xl font-bold text-primary">+{remainingOtherCount}</div>
                <div className="text-xs text-muted-foreground">More</div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePostFilePreview;
