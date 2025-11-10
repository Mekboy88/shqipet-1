
import React from 'react';
import ProfileAvatar from './components/ProfileAvatar';
import ProfileDetails from './components/ProfileDetails';
import ProfileActions from './components/ProfileActions';
import { useAuth } from '@/contexts/AuthContext';

const ProfileInfo: React.FC = () => {
  const { user } = useAuth();
  
  // Placeholder handlers for the actions
  const handleAddStoryClick = () => {
    console.log('Add story clicked');
  };

  const handleEditProfileClick = () => {
    console.log('Edit profile clicked');
  };

  return (
    <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
      {user && (
        <ProfileAvatar
          userId={user.id}
          size="xl"
          className="w-40 h-40"
        />
      )}
      
      <div className="flex-1 text-center md:text-left">
        <ProfileDetails friendCount="0" />
        <ProfileActions 
          onAddStoryClick={handleAddStoryClick}
          onEditProfileClick={handleEditProfileClick}
        />
      </div>
    </div>
  );
};

export default ProfileInfo;
