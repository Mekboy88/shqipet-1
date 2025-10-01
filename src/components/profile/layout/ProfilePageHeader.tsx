
import React, { RefObject } from 'react';
import CoverPhotoSection from './components/CoverPhotoSection';
import { UserData } from '../data/userData';

interface ProfilePageHeaderProps {
  headerRef: RefObject<HTMLDivElement>;
  userData: UserData;
  coverPhotoUrl: string;
  onEditCoverClick: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const ProfilePageHeader: React.FC<ProfilePageHeaderProps> = ({
  headerRef,
  userData,
  coverPhotoUrl,
  onEditCoverClick,
  activeTab,
  setActiveTab
}) => {
  return (
    <div ref={headerRef} className="relative bg-white shadow-sm mx-0">
      <CoverPhotoSection 
        coverPhotoUrl={coverPhotoUrl} 
        onEditCoverClick={onEditCoverClick}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
};

export default ProfilePageHeader;
