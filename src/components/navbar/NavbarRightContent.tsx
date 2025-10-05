import React, { useEffect, useState } from 'react';
import NavbarActionButtons from './NavbarActionButtons';
import UserProfileDropdown from '@/components/UserProfileDropdown';
import ProfessionalPresentationSettingsDropdown from './ProfessionalPresentationSettingsDropdown';
import MobilePreviewModal from './MobilePreviewModal';
import { mediaService } from '@/services/media/MediaService';
import { useLocation } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
interface NavbarRightContentProps {
  professionalEditMode?: boolean;
  setProfessionalEditMode?: (value: boolean) => void;
  professionalSections?: {
    home: boolean;
    skills: boolean;
    portfolio: boolean;
    blogs: boolean;
    contact: boolean;
  };
  setProfessionalSections?: React.Dispatch<React.SetStateAction<{
    home: boolean;
    skills: boolean;
    portfolio: boolean;
    blogs: boolean;
    contact: boolean;
  }>>;
  professionalSocials?: Array<{
    label: string;
    url: string;
    icon?: string;
  }>;
  setProfessionalSocials?: React.Dispatch<React.SetStateAction<Array<{
    label: string;
    url: string;
    icon?: string;
  }>>>;
  professionalHireButton?: {
    enabled: boolean;
    text: string;
    url: string;
    email: string;
  };
  setProfessionalHireButton?: React.Dispatch<React.SetStateAction<{
    enabled: boolean;
    text: string;
    url: string;
    email: string;
  }>>;
  professionalProfile?: {
    firstName: string;
    lastName: string;
    presentation: string;
    photoUrl: string;
    aboutMe: string;
    highlights: string[];
  };
}

const NavbarRightContent: React.FC<NavbarRightContentProps> = ({ 
  professionalEditMode, 
  setProfessionalEditMode,
  professionalSections,
  setProfessionalSections,
  professionalSocials,
  setProfessionalSocials,
  professionalHireButton,
  setProfessionalHireButton,
  professionalProfile
}) => {
  const location = useLocation();
  const isProfessionalPresentation = location.pathname === '/professional-presentation';
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  console.log('🔍 NavbarRightContent rendering with enhanced console controls');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Enhanced function to move search bar with precise control
      window.moveSearchBar = (direction: 'left' | 'right', amount: number = 1) => {
        const searchContainer = document.querySelector('.search-bar-container') as HTMLElement;
        if (searchContainer) {
          const currentTransform = searchContainer.style.transform || 'translateX(0px)';
          const currentX = parseFloat(currentTransform.match(/translateX\(([^)]+)px\)/)?.[1] || '0');
          const newX = direction === 'right' ? currentX + amount : currentX - amount;
          searchContainer.style.transform = `translateX(${newX}px)`;
          console.log(`🎯 Search bar moved ${amount}px to the ${direction}. Current position: ${newX}px`);
        }
      };

      // Set exact position function
      window.setSearchBarPosition = (pixels: number) => {
        const searchContainer = document.querySelector('.search-bar-container') as HTMLElement;
        if (searchContainer) {
          searchContainer.style.transform = `translateX(${pixels}px)`;
          console.log(`🎯 Search bar set to exact position: ${pixels}px`);
        }
      };

      // Preset movement functions with flexible amounts
      window.moveSearchBarLeft = (amount = 10) => {
        if (window.moveSearchBar) {
          window.moveSearchBar('left', amount);
        }
      };
      window.moveSearchBarRight = (amount = 10) => {
        if (window.moveSearchBar) {
          window.moveSearchBar('right', amount);
        }
      };

      // Fine adjustment functions
      window.moveSearchBarLeftTiny = (amount = 1) => {
        if (window.moveSearchBar) {
          window.moveSearchBar('left', amount);
        }
      };
      window.moveSearchBarRightTiny = (amount = 1) => {
        if (window.moveSearchBar) {
          window.moveSearchBar('right', amount);
        }
      };

      // Large movement functions
      window.moveSearchBarLeftBig = (amount = 50) => {
        if (window.moveSearchBar) {
          window.moveSearchBar('left', amount);
        }
      };
      window.moveSearchBarRightBig = (amount = 50) => {
        if (window.moveSearchBar) {
          window.moveSearchBar('right', amount);
        }
      };

      // Reset function
      window.resetSearchBarPosition = () => {
        const searchContainer = document.querySelector('.search-bar-container') as HTMLElement;
        if (searchContainer) {
          searchContainer.style.transform = 'translateX(0px)';
          console.log('🔄 Search bar position reset to default');
        }
      };

      // Get current position function
      window.getSearchBarPosition = () => {
        const searchContainer = document.querySelector('.search-bar-container') as HTMLElement;
        if (searchContainer) {
          const currentTransform = searchContainer.style.transform || 'translateX(0px)';
          const currentX = parseFloat(currentTransform.match(/translateX\(([^)]+)px\)/)?.[1] || '0');
          console.log(`📍 Current search bar position: ${currentX}px`);
          return currentX;
        }
        return 0;
      };

      // Apply custom CSS positioning
      window.setSearchBarCSS = (cssProperties: Record<string, string>) => {
        const searchContainer = document.querySelector('.search-bar-container') as HTMLElement;
        if (searchContainer) {
          Object.entries(cssProperties).forEach(([property, value]) => {
            searchContainer.style[property as any] = value;
          });
          console.log('🎨 Applied custom CSS to search bar:', cssProperties);
        }
      };

      // Remove all custom positioning
      window.clearSearchBarStyles = () => {
        const searchContainer = document.querySelector('.search-bar-container') as HTMLElement;
        if (searchContainer) {
          searchContainer.style.transform = '';
          searchContainer.style.marginLeft = '';
          searchContainer.style.marginRight = '';
          searchContainer.style.position = '';
          searchContainer.style.left = '';
          searchContainer.style.right = '';
          console.log('🧹 Cleared all custom search bar styles');
        }
      };
      console.log(`
🎮 ENHANCED SEARCH BAR CONSOLE CONTROLS:

📍 BASIC POSITIONING:
- moveSearchBarLeft(pixels)         - Move left (default: 10px)
- moveSearchBarRight(pixels)        - Move right (default: 10px)
- setSearchBarPosition(pixels)      - Set exact position

🔧 FINE & LARGE MOVEMENTS:
- moveSearchBarLeftTiny(pixels)     - Move left tiny (default: 1px)
- moveSearchBarRightTiny(pixels)    - Move right tiny (default: 1px)
- moveSearchBarLeftBig(pixels)      - Move left big (default: 50px)
- moveSearchBarRightBig(pixels)     - Move right big (default: 50px)

⚡ ADVANCED CONTROLS:
- moveSearchBar('left'|'right', px) - Custom direction & amount
- setSearchBarCSS({prop: 'value'})  - Apply custom CSS
- clearSearchBarStyles()            - Remove all custom styles

📊 UTILITIES:
- getSearchBarPosition()            - Get current position
- resetSearchBarPosition()          - Reset to default

💡 EXAMPLES:
- moveSearchBarLeft(25)             - Move 25px left
- setSearchBarPosition(-100)        - Position 100px to the left
- setSearchBarCSS({marginLeft: '20px', position: 'relative'})
- moveSearchBar('right', 75)        - Move 75px right

🎯 Full control - position the search bar exactly where you want!
          `);

      // ============== Avatar Debug Tools ==============
      (window as any).avatarDebug = {
        help() {
          console.log(`\n🛠️ Avatar Debug Tools:\n- avatarDebug.print([userId])\n- avatarDebug.reload([userId])\n- avatarDebug.clearCache(userId)\n- avatarDebug.clearAllCaches()\n- avatarDebug.showLocalCache(userId)\n- avatarDebug.removeLocalCache(userId)\n`);
        },
        print(userId?: string) {
          const map = (window as any).__avatarDebugMap || {};
          console.log('🧪 __avatarDebugMap:', map);
          if (userId) {
            const entry = map[userId];
            const ls = localStorage.getItem(`avatar_cache_${userId}`);
            console.log('🧾 user entry:', entry);
            console.log('🗄️ localStorage:', ls ? JSON.parse(ls) : null);
          }
        },
        reload(userId?: string) {
          const detail = userId ? { userId } : undefined;
          window.dispatchEvent(new CustomEvent('avatar:reload', { detail } as any));
          console.log('🔄 Dispatched avatar:reload', detail || '(all mounted hooks)');
        },
        clearCache(userId: string) {
          localStorage.removeItem(`avatar_cache_${userId}`);
          console.log('🧹 Cleared avatar local cache for', userId);
        },
        clearAllCaches() {
          try { mediaService.clearAllCaches(); console.log('🧹 Cleared media service caches'); } catch {}
          // Clear all avatar local caches
          Object.keys(localStorage).forEach(k => { if (k.startsWith('avatar_cache_')) localStorage.removeItem(k); });
          console.log('🧼 Cleared all avatar_* local caches');
        },
        showLocalCache(userId: string) {
          const v = localStorage.getItem(`avatar_cache_${userId}`);
          console.log('🗄️ avatar_cache value:', v ? JSON.parse(v) : null);
        },
        removeLocalCache(userId: string) {
          localStorage.removeItem(`avatar_cache_${userId}`);
          console.log('🗑️ Removed avatar_cache for', userId);
        }
      };
      (window as any).avatarDebug.help();
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.moveSearchBar;
        delete window.moveSearchBarLeft;
        delete window.moveSearchBarRight;
        delete window.moveSearchBarLeftTiny;
        delete window.moveSearchBarRightTiny;
        delete window.moveSearchBarLeftBig;
        delete window.moveSearchBarRightBig;
        delete window.resetSearchBarPosition;
        delete window.setSearchBarPosition;
        delete window.getSearchBarPosition;
        delete window.setSearchBarCSS;
        delete window.clearSearchBarStyles;
      }
    };
  }, []);
  return (
    <>
      <div className="flex items-center justify-end w-full">
        {/* Action Buttons and User Profile */}
        <div className="flex items-center gap-2">
          <NavbarActionButtons />
          {isProfessionalPresentation && professionalEditMode !== undefined && setProfessionalEditMode && professionalSections && setProfessionalSections && professionalSocials && setProfessionalSocials && professionalHireButton && setProfessionalHireButton && (
            <>
              {/* Mobile Preview Button */}
              <button
                onClick={() => setShowMobilePreview(true)}
                className="h-10 w-10 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-100 flex items-center justify-center"
                aria-label="Mobile Preview"
              >
                <svg height="18px" width="18px" version="1.1" viewBox="0 0 512 512" className="text-gray-600" fill="currentColor">
                  <g transform="translate(1 1)">
                    <path d="M366.258,511H143.734c-18.637,0-33.801-15.164-33.801-33.809V32.809C109.933,14.164,125.097-1,143.734-1h222.524 c18.645,0,33.809,15.164,33.809,33.809v444.382C400.067,495.836,384.903,511,366.258,511z M143.734,16.067 c-9.224,0-16.734,7.509-16.734,16.742v444.382c0,9.233,7.509,16.742,16.734,16.742h222.524c9.233,0,16.742-7.509,16.742-16.742 V32.809c0-9.233-7.509-16.742-16.742-16.742H143.734z"/>
                    <path d="M400.067,442.733H109.933V50.2h290.133V442.733z M127,425.667h256v-358.4H127V425.667z"/>
                    <path d="M289.133,41.667h-42.667c-4.71,0-8.533-3.823-8.533-8.533s3.823-8.533,8.533-8.533h42.667c4.719,0,8.533,3.823,8.533,8.533 S293.852,41.667,289.133,41.667z"/>
                    <path d="M220.867,41.667h-8.533c-4.71,0-8.533-3.823-8.533-8.533s3.823-8.533,8.533-8.533h8.533c4.71,0,8.533,3.823,8.533,8.533 S225.577,41.667,220.867,41.667z"/>
                    <path d="M255,502.467c-18.824,0-34.133-15.309-34.133-34.133c0-18.824,15.309-34.133,34.133-34.133s34.133,15.309,34.133,34.133 C289.133,487.158,273.824,502.467,255,502.467z M255,451.267c-9.412,0-17.067,7.654-17.067,17.067 c0,9.412,7.654,17.067,17.067,17.067s17.067-7.654,17.067-17.067C272.067,458.921,264.412,451.267,255,451.267z"/>
                  </g>
                </svg>
              </button>
              
              <ProfessionalPresentationSettingsDropdown 
                editMode={professionalEditMode} 
                setEditMode={setProfessionalEditMode}
                sections={professionalSections}
                setSections={setProfessionalSections}
                socials={professionalSocials}
                setSocials={setProfessionalSocials}
                hireButton={professionalHireButton}
                setHireButton={setProfessionalHireButton}
              />
            </>
          )}
          <UserProfileDropdown />
        </div>
      </div>

      {/* Mobile Preview Modal */}
      {isProfessionalPresentation && professionalProfile && professionalSections && professionalSocials && (
        <MobilePreviewModal
          isOpen={showMobilePreview}
          onClose={() => setShowMobilePreview(false)}
          profile={professionalProfile}
          socials={professionalSocials}
          sections={professionalSections}
        />
      )}
    </>
  );
};
export default NavbarRightContent;