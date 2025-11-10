
import React, { useState } from 'react';
import { useUniversalUser } from '@/hooks/useUniversalUser';
import { useGlobalAvatar } from '@/hooks/useGlobalAvatar';
import CreateStoryModal from './CreateStoryModal';
import Avatar from '@/components/Avatar';

interface CreateStoryCardProps {
  user: {
    name: string;
    image: string;
  };
}

const CreateStoryCard: React.FC<CreateStoryCardProps> = ({ user }) => {
  const { displayName, firstName, lastName, initials: userInitials } = useUniversalUser();
  const { avatarUrl } = useGlobalAvatar();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const nameInitials = firstName && lastName
    ? `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`
    : '';
  const finalInitials = (userInitials || nameInitials || '??').trim();

  const handleCreateStory = () => {
    setIsModalOpen(true);
  };


  return (
    <>
      <div className="story-card create-story cursor-pointer relative" onClick={handleCreateStory}>
        {/* Phone frame border */}
        <div className="absolute inset-0 rounded-[10px] border-[3px] border-black z-20 pointer-events-none"></div>
        
        <div className="w-full h-full relative overflow-hidden">
          {avatarUrl ? (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${avatarUrl})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <span className="text-4xl font-bold text-muted-foreground select-none">
                {finalInitials}
              </span>
            </div>
          )}
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
