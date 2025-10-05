import React from 'react';
import { X } from 'lucide-react';

interface MobilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    firstName: string;
    lastName: string;
    presentation: string;
    photoUrl: string;
    aboutMe: string;
    highlights: string[];
  };
  socials: Array<{
    label: string;
    url: string;
    icon?: string;
  }>;
  sections: {
    home: boolean;
    skills: boolean;
    portfolio: boolean;
    blogs: boolean;
    contact: boolean;
  };
}

const MobilePreviewModal: React.FC<MobilePreviewModalProps> = ({
  isOpen,
  onClose,
  profile,
  socials,
  sections
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Mobile Device Frame */}
      <div className="relative bg-gray-900 rounded-[3rem] p-4 shadow-2xl" style={{ width: '375px', height: '667px' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
          aria-label="Close preview"
        >
          <X size={24} />
        </button>

        {/* Mobile Screen */}
        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-y-auto">
          {/* Photo Section */}
          <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200">
            {profile.photoUrl ? (
              <img 
                src={profile.photoUrl} 
                alt={`${profile.firstName} ${profile.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-6xl">{profile.firstName?.[0]}{profile.lastName?.[0]}</span>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="p-4 space-y-4">
            {/* Name and Presentation */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h1>
              {profile.presentation && (
                <p className="text-sm text-gray-600">{profile.presentation}</p>
              )}
            </div>

            {/* Social Links */}
            {socials.length > 0 && (
              <div className="flex justify-center gap-3 flex-wrap">
                {socials.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 transition-colors"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {sections.home && (
                <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                  Home
                </button>
              )}
              {sections.skills && (
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                  Skills
                </button>
              )}
              {sections.portfolio && (
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                  Portfolio
                </button>
              )}
              {sections.blogs && (
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                  Blogs
                </button>
              )}
              {sections.contact && (
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                  Contact
                </button>
              )}
            </div>

            {/* About Me Section */}
            {profile.aboutMe && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">About Me</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{profile.aboutMe}</p>
              </div>
            )}

            {/* Highlights Section */}
            {profile.highlights && profile.highlights.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">Highlights</h2>
                <ul className="space-y-2">
                  {profile.highlights.map((highlight, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Device Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl"></div>
      </div>
    </div>
  );
};

export default MobilePreviewModal;
