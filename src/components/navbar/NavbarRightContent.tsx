import React, { useEffect } from 'react';
import NavbarActionButtons from './NavbarActionButtons';
import UserProfileDropdown from '@/components/UserProfileDropdown';
import ProfessionalPresentationSettingsDropdown from './ProfessionalPresentationSettingsDropdown';
import { mediaService } from '@/services/media/MediaService';
import { useLocation } from 'react-router-dom';
interface NavbarRightContentProps {
  professionalEditMode?: boolean;
  setProfessionalEditMode?: (value: boolean) => void;
}

const NavbarRightContent: React.FC<NavbarRightContentProps> = ({ 
  professionalEditMode, 
  setProfessionalEditMode 
}) => {
  const location = useLocation();
  const isProfessionalPresentation = location.pathname === '/professional-presentation';
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
  return <div className="flex items-center justify-end w-full">
      {/* Action Buttons and User Profile */}
      <div className="flex items-center">
        <NavbarActionButtons />
        {isProfessionalPresentation && professionalEditMode !== undefined && setProfessionalEditMode && (
          <ProfessionalPresentationSettingsDropdown 
            editMode={professionalEditMode} 
            setEditMode={setProfessionalEditMode} 
          />
        )}
        <UserProfileDropdown />
      </div>
    </div>;
};
export default NavbarRightContent;