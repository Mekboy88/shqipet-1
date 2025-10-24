
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Image, Video, Plus } from 'lucide-react';
import LiveIcon from '@/components/icons/LiveIcon';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/Avatar';
import CreatePostCardSkeleton from './CreatePostCardSkeleton';

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
          <div className="flex-1 bg-secondary rounded-lg px-4 py-2.5 text-muted-foreground cursor-pointer hover:bg-secondary/80 text-left">
            Qdo moment është një fillim i ri.......
          </div>
        </div>
        
        <Separator className="my-3" />
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button variant="secondary" className="h-10 rounded-full font-medium text-xs sm:text-sm">
            <Image className="w-5 h-5 mr-2 text-blue-500" />
            Upload Images
          </Button>
          <Button variant="secondary" className="h-10 rounded-full font-medium text-xs sm:text-sm">
            <Video className="w-5 h-5 mr-2 text-green-500" />
            Upload Video
          </Button>
          <div className="flex items-center justify-center cursor-pointer">
            <LiveIcon className="w-16 h-16 mr-2 text-red-500" />
            <span className="font-medium text-xs sm:text-sm">Live</span>
          </div>
          <Button variant="secondary" className="h-10 rounded-full font-medium text-xs sm:text-sm">
            <Plus className="w-5 h-5 mr-2" />
            More
          </Button>
        </div>
      </Card>
    </>
  );
};

export default CreatePostCard;
