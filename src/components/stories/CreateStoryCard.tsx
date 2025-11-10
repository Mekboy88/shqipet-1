
import React, { useState } from 'react';
import { useUniversalUser } from '@/hooks/useUniversalUser';
import CreateStoryModal from './CreateStoryModal';
import Avatar from '@/components/Avatar';

interface CreateStoryCardProps {
  user: {
    name: string;
    image: string;
  };
}

const CreateStoryCard: React.FC<CreateStoryCardProps> = ({ user }) => {
  const { displayName } = useUniversalUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateStory = () => {
    setIsModalOpen(true);
  };


  return (
    <>
      <div className="story-card create-story cursor-pointer relative" onClick={handleCreateStory}>
        {/* Phone frame border */}
        <div className="absolute inset-0 rounded-[10px] border-[3px] border-black z-20 pointer-events-none"></div>
        
        <div className="w-full h-full relative overflow-hidden">
          <Avatar 
            size="2xl"
            className="w-full h-full rounded-none"
          />
        </div>

        <div className="absolute bottom-2 left-1 right-1 z-10">
          <div className="flex items-center bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 w-full border border-white/30">
            <Avatar 
              size="xs"
              className="w-5 h-5 mr-2 flex-shrink-0"
            />
            <p className="text-white text-xs font-medium truncate flex-1">{user.name}</p>
          </div>
        </div>
      </div>

      <CreateStoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default CreateStoryCard;
