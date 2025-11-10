
import React from 'react';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ProfileNavigationProps {
  name: string;
  isNavigationSticky: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ProfileNavigation: React.FC<ProfileNavigationProps> = ({
  name,
  isNavigationSticky,
  activeTab,
  onTabChange
}) => {
  const tabs = [{
    id: 'posts',
    label: 'Postimet'
  }, {
    id: 'about',
    label: 'Rreth'
  }, {
    id: 'friends',
    label: 'Miqtë'
  }, {
    id: 'photos',
    label: 'Fotot'
  }, {
    id: 'videos',
    label: 'Videot'
  }, {
    id: 'reels',
    label: 'Reels'
  }];
  
  const profileMenuItems = ['Shiko si', 'Kërko', 'Statusi i profilit', 'Arkiva', 'Arkiva e rrëfimeve', 'Regjistri i aktivitetit', 'Cilësimet e profilit dhe etiketimit', 'Aktivizo modalitetin profesional', 'Krijo një profil tjetër', 'MetaAlbos i verifikuar'];
  const moreMenuItems = ['Check-ins', 'Sportet', 'Muzika', 'Filmat', 'Shfaqjet televizive', 'Librat', 'Aplikacionet dhe lojërat', 'Pëlqimet', 'Ngjarjet', 'Vlerësimet e dhëna', 'Grupet', 'Menaxho seksionet'];

  return (
    <>
      {/* Border line below the section - with ultra-fast transition */}
      <div className="border-b bg-gray-350 mt-2 px-0 py-[2px] mx-[28px] my-0 transition-opacity duration-50 ease-in-out" style={{
        opacity: isNavigationSticky ? 0 : 1
      }}></div>
      
      {/* Navigation Section - with ultra-fast transition */}
      <div style={{
        marginTop: isNavigationSticky ? '10px' : '20px',
        transition: 'margin-top 0.05s ease-in-out'
      }} className="px-6 pt-2 pb-2 flex items-center justify-between py-[9px]">
        {/* Show profile circle and name when sticky, otherwise show navigation tabs */}
        {isNavigationSticky ? (
          <div className="flex items-center animate-fade-in">
            <Avatar size="sm" className="mr-3" />
            <h2 className="text-lg font-semibold">{name}</h2>
          </div>
        ) : (
          <div className="flex items-center space-x-1 animate-fade-in">
            {tabs.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => onTabChange(tab.id)} 
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out
                  hover:bg-gray-100 outline-none border-none
                  relative cursor-pointer select-none flex items-center gap-1
                  ${activeTab === tab.id ? '' : 'text-gray-600 hover:text-gray-800'}
                `} 
                style={activeTab === tab.id ? {
                  background: 'linear-gradient(90deg, #ff3a3a, #8b0000)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent'
                } : {}}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-md py-px my-[-11px] transition-all duration-300 ease-in-out" style={{
                    background: 'linear-gradient(90deg, #ff3a3a, #8b0000)'
                  }} />
                )}
              </button>
            ))}
            
            {/* More dropdown button - styled like the other tabs */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out
                  hover:bg-gray-100 outline-none border-none
                  relative cursor-pointer select-none flex items-center gap-1
                  text-gray-600 hover:text-gray-800
                `}>
                  Më shumë
                  <ChevronDown className="h-3 w-3 ml-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" style={{
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)'
              }} className="w-56 bg-white shadow-lg border border-gray-200 rounded-lg z-50 my-[6px]">
                {moreMenuItems.map((item, index) => (
                  <DropdownMenuItem 
                    key={index} 
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer focus:bg-gray-100 focus:outline-none" 
                    onClick={() => {
                      console.log(`Clicked on ${item}`);
                      // Add your navigation logic here
                    }}
                  >
                    {item}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        {/* Three dots menu button - Facebook style dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 px-[11px] border-0 focus:outline-none focus:ring-0 focus:border-0 active:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none data-[state=open]:border-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            backdropFilter: 'blur(16px)'
          }} className="w-64 bg-white rounded-lg shadow-2xl border-0 z-[100] p-2 py-0 my-[2px]">
            {/* Arrow pointing to the button */}
            <div className="absolute -top-2 right-4 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-200" style={{
              boxShadow: '-2px -2px 4px rgba(0, 0, 0, 0.1)'
            }} />
            {profileMenuItems.map((item, index) => (
              <DropdownMenuItem 
                key={index} 
                className="px-3 py-2.5 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer focus:bg-gray-100 focus:outline-none rounded-md transition-colors duration-150 flex items-center gap-3" 
                onClick={() => {
                  console.log(`Clicked on ${item}`);
                  // Add your navigation logic here
                }}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  {/* You can add specific icons for each menu item here */}
                  <div className="w-1 h-1 bg-gray-400 rounded-full" />
                </div>
                {item}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

export default ProfileNavigation;
