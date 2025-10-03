
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
            <svg 
              className="w-[50px] h-[46px] flex-shrink-0" 
              width="50" 
              height="46" 
              viewBox="0 0 512 512" 
              xmlns="http://www.w3.org/2000/svg"
              transform="rotate(-45)"
            >
              <g transform="translate(-1)">
                <path fill="#FDC794" d="M426.201,347.119v-86.78c0-16.488-13.885-34.712-30.373-34.712s-30.373,17.356-30.373,33.844 v-42.522c0-16.488-13.885-34.712-30.373-34.712s-30.373,18.224-30.373,34.712v60.746v-95.458c0-16.488-13.885-34.712-30.373-34.712 s-30.373,18.224-30.373,34.712v-69.424c0-16.488-13.885-34.712-30.373-34.712s-30.373,18.224-30.373,34.712v190.915 c0-24.298-20.827-72.895-43.39-95.458c-19.092-19.092-72.895-6.075-43.39,34.712c20.827,28.637,29.505,90.251,34.712,121.492 c13.017,76.366,60.746,86.78,60.746,86.78V512h208.271v-60.746l0,0C427.936,413.939,426.201,433.031,426.201,347.119"/>
                <g>
                  <path fill="#71C386" d="M217.93,52.068c-5.207,0-8.678-3.471-8.678-8.678V8.678c0-5.207,3.471-8.678,8.678-8.678 c5.207,0,8.678,3.471,8.678,8.678V43.39C226.608,48.597,223.136,52.068,217.93,52.068"/>
                  <path fill="#71C386" d="M313.387,104.136h-34.712c-5.207,0-8.678-3.471-8.678-8.678c0-5.207,3.471-8.678,8.678-8.678 h34.712c5.207,0,8.678,3.471,8.678,8.678C322.065,100.664,318.594,104.136,313.387,104.136"/>
                  <path fill="#71C386" d="M148.506,104.136h-34.712c-5.207,0-8.678-3.471-8.678-8.678c0-5.207,3.471-8.678,8.678-8.678 h34.712c5.207,0,8.678,3.471,8.678,8.678C157.184,100.664,153.713,104.136,148.506,104.136"/>
                  <path fill="#71C386" d="M261.32,69.424c-2.603,0-4.339-0.868-6.075-2.603c-3.471-3.471-3.471-8.678,0-12.149l26.034-26.034 c3.471-3.471,8.678-3.471,12.149,0c3.471,3.471,3.471,8.678,0,12.149L267.394,66.82C265.659,68.556,263.923,69.424,261.32,69.424"/>
                  <path fill="#71C386" d="M165.862,69.424c-2.603,0-4.339-0.868-6.075-2.603l-26.034-26.034 c-3.471-3.471-3.471-8.678,0-12.149c3.471-3.471,8.678-3.471,12.149,0l26.034,26.034c3.471,3.471,3.471,8.678,0,12.149 C170.201,68.556,168.465,69.424,165.862,69.424"/>
                </g>
                <g>
                  <path fill="#F9A671" d="M304.709,442.576h-26.034c-5.207,0-8.678-3.471-8.678-8.678c0-5.207,3.471-8.678,8.678-8.678 h26.034c5.207,0,8.678,3.471,8.678,8.678C313.387,439.105,309.916,442.576,304.709,442.576"/>
                  <path fill="#F9A671" d="M313.387,477.288h-43.39c-5.207,0-8.678-3.471-8.678-8.678s3.471-8.678,8.678-8.678h43.39 c5.207,0,8.678,3.471,8.678,8.678S318.594,477.288,313.387,477.288"/>
                  <path fill="#F9A671" d="M243.964,277.695c-5.207,0-8.678-3.471-8.678-8.678V156.203c0-5.207,3.471-8.678,8.678-8.678 s8.678,3.471,8.678,8.678v112.814C252.642,274.224,249.17,277.695,243.964,277.695"/>
                  <path fill="#F9A671" d="M304.709,286.373c-5.207,0-8.678-3.471-8.678-8.678v-86.78c0-5.207,3.471-8.678,8.678-8.678 s8.678,3.471,8.678,8.678v86.78C313.387,282.902,309.916,286.373,304.709,286.373"/>
                  <path fill="#F9A671" d="M365.455,286.373c-5.207,0-8.678-3.471-8.678-8.678v-43.39c0-5.207,3.471-8.678,8.678-8.678 c5.207,0,8.678,3.471,8.678,8.678v43.39C374.133,282.902,370.662,286.373,365.455,286.373"/>
                </g>
              </g>
            </svg>
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
