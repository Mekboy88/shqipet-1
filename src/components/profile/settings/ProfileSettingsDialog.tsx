import React from 'react';
import { createPortal } from 'react-dom';
import ProfileSettingsSidebar from './ProfileSettingsSidebar';
import ProfileSettingsContent from './ProfileSettingsContent';

interface ProfileSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  userInfo: any;
  setUserInfo: React.Dispatch<React.SetStateAction<any>>;
}

const ProfileSettingsDialog: React.FC<ProfileSettingsDialogProps> = ({
  isOpen,
  onClose,
  activeSection,
  setActiveSection
}) => {
  React.useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow || '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000]" style={{ pointerEvents: 'auto' }}>
      {/* Wallpaper layer */}
      <div className="absolute top-[57px] left-0 right-0 bottom-0 bg-gray-100" style={{ pointerEvents: 'none' }}></div>
      
      {/* Windows container */}
      <div className="relative w-[1040px] h-[calc(100vh-120px)] absolute left-1/2 transform -translate-x-1/2 z-[1010]" style={{ top: '80px', pointerEvents: 'auto' }}>
        <div className="w-full h-full flex flex-row">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden w-80 flex-shrink-0 -ml-2 h-full" style={{ pointerEvents: 'auto' }}>
            <ProfileSettingsSidebar activeSection={activeSection} setActiveSection={setActiveSection} onClose={onClose} />
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden flex-1 ml-4 h-full" style={{ pointerEvents: 'auto' }}>
            <ProfileSettingsContent activeSection={activeSection} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProfileSettingsDialog;