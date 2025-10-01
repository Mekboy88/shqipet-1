
import React, { useState, useEffect } from 'react';
import { useUniversalUser } from '@/hooks/useUniversalUser';
import { processWasabiUrl } from '@/services/media/LegacyMediaService';
import CreateStoryModal from './CreateStoryModal';

interface CreateStoryCardProps {
  user: {
    name: string;
    image: string;
  };
}

const CreateStoryCard: React.FC<CreateStoryCardProps> = ({ user }) => {
  const { avatarUrl } = useUniversalUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | null>(null);

  const handleCreateStory = () => {
    setIsModalOpen(true);
  };

  useEffect(() => {
    let canceled = false;
    const resolve = async () => {
      try {
        if (!avatarUrl) { if (!canceled) setResolvedAvatarUrl(null); return; }
        if (avatarUrl.startsWith('http') || avatarUrl.startsWith('blob:') || avatarUrl.startsWith('data:')) {
          if (!canceled) setResolvedAvatarUrl(avatarUrl);
        } else {
          const signed = await processWasabiUrl(avatarUrl);
          if (!canceled) setResolvedAvatarUrl(signed);
        }
      } catch (e) {
        console.warn('CreateStoryCard: failed to resolve avatar:', e);
        if (!canceled) setResolvedAvatarUrl(null);
      }
    };
    resolve();
    return () => { canceled = true; };
  }, [avatarUrl]);

  useEffect(() => {
    if (!avatarUrl) return;
    const id = setInterval(async () => {
      try {
        if (avatarUrl && !avatarUrl.startsWith('http')) {
          const signed = await processWasabiUrl(avatarUrl);
          setResolvedAvatarUrl(signed);
        }
      } catch (e) {
        console.warn('CreateStoryCard: auto-refresh failed:', e);
      }
    }, 12 * 60 * 1000);
    return () => clearInterval(id);
  }, [avatarUrl]);

  return (
    <>
      <div className="story-card create-story cursor-pointer relative" onClick={handleCreateStory}>
        {/* Phone frame border */}
        <div className="absolute inset-0 rounded-[10px] border-[3px] border-black z-20 pointer-events-none"></div>
        
        <div className="h-[75%] relative overflow-hidden">
          {(resolvedAvatarUrl || user.image) ? (
            <img 
              src={resolvedAvatarUrl || user.image}
              alt={user.name} 
              className="w-full h-full object-cover sharp-image" 
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-red-500/10 to-gray-800/10" />
          )}
        </div>
        <div className="bg-white h-[25%] flex flex-col items-start justify-center pb-1 pl-1">
          <div className="flex items-center gap-1">
            <img 
              src="/lovable-uploads/090a3f75-cf49-4a10-81c6-63bab0452fb3.png" 
              alt="Create story icon" 
              className="w-[50px] h-[46px] flex-shrink-0"
              style={{ width: '50px', height: '46px' }}
            />
            <p className="text-sm font-extrabold text-left leading-tight">Krijo histori</p>
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
