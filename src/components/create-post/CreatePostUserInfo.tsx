
import React from "react";
import Avatar from "@/components/Avatar";
import { useUniversalUser } from '@/hooks/useUniversalUser';

interface CreatePostUserInfoProps {
  userName?: string;
  userImage?: string;
  initials?: string;
}

const CreatePostUserInfo: React.FC<CreatePostUserInfoProps> = () => {
  // Use global avatar hook - ignore props for consistency
  const { displayName } = useUniversalUser();

  return (
    <div className="flex items-center gap-2">
      <Avatar size="md" />
      <div className="flex flex-col">
        <span className="font-semibold">{displayName || "User"}</span>
        <button className="flex items-center gap-1 bg-gray-200 rounded-md px-2 py-0.5 text-sm">
          <span>Only me</span>
          <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current">
            <path d="M11.293 4.293a1 1 0 0 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 7.586l3.293-3.293z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CreatePostUserInfo;
