
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Image, Video, Plus } from 'lucide-react';
import LiveIcon from '@/components/icons/LiveIcon';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/Avatar';

const CreatePostCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleOpenCreatePost = () => {
    navigate('/create-post');
  };

  return (
    <>
      <Card 
        data-create-post-card 
        className="p-4 mb-4 shadow-sm bg-card rounded-2xl cursor-pointer" 
        onClick={handleOpenCreatePost}
      >
          <div className="flex items-center space-x-3">
            <Avatar size="md" className="h-10 w-10" />
            <div
              role="button"
              aria-label="Open create post"
              title="Çdo moment është një fillim i ri"
              className="flex items-center gap-2 flex-1 bg-secondary rounded-lg px-4 py-2.5 text-muted-foreground cursor-pointer hover:bg-secondary/80 text-left"
            >
              <span>Çdo moment është një fillim i ri</span>
              <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600 flex-shrink-0">
                <path d="M12 18c4 0 5-4 5-4H7s1 4 5 4z"></path>
                <path d="M12 22c5.514 0 10-4.486 10-10S17.514 2 12 2 2 6.486 2 12s4.486 10 10 10zm0-18c4.411 0 8 3.589 8 8s-3.589 8-8 8-8-3.589-8-8 3.589-8 8-8z"></path>
                <path d="m8.535 12.634 2.05-2.083a1.485 1.485 0 0 0-.018-2.118 1.49 1.49 0 0 0-2.065-.034 1.488 1.488 0 0 0-2.067.068c-.586.6-.579 1.53.019 2.117l2.081 2.05zm7 0 2.05-2.083a1.485 1.485 0 0 0-.018-2.118 1.49 1.49 0 0 0-2.065-.034 1.488 1.488 0 0 0-2.068.067c-.586.6-.579 1.53.019 2.117l2.082 2.051z"></path>
              </svg>
            </div>
          </div>
        
        <Separator className="my-3" />
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button 
            variant="secondary" 
            className="h-10 rounded-full font-medium text-xs sm:text-sm"
            onClick={handleOpenCreatePost}
          >
            <Image className="w-5 h-5 mr-2 text-blue-500" />
            Upload Images
          </Button>
          <Button 
            variant="secondary" 
            className="h-10 rounded-full font-medium text-xs sm:text-sm"
            onClick={handleOpenCreatePost}
          >
            <Video className="w-5 h-5 mr-2 text-green-500" />
            Upload Video
          </Button>
          <div className="flex items-center justify-center cursor-pointer" onClick={handleOpenCreatePost}>
            <LiveIcon className="w-16 h-16 mr-2 text-red-500" />
            <span className="font-medium text-xs sm:text-sm">Live</span>
          </div>
          <Button 
            variant="secondary" 
            className="h-10 rounded-full font-medium text-xs sm:text-sm"
            onClick={handleOpenCreatePost}
          >
            <Plus className="w-5 h-5 mr-2" />
            More
          </Button>
        </div>
      </Card>
    </>
  );
};

export default CreatePostCard;
