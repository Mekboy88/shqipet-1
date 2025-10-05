import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Moon, LogOut, Pencil, Wallet, Disc, Zap, Megaphone, Newspaper, LayoutGrid, RefreshCw, Command, Crown, Shield } from "lucide-react";
import Avatar from "@/components/Avatar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useAuth } from '@/contexts/AuthContext';
import { useSecureRoles } from '@/hooks/users/use-secure-roles';
import { Separator } from "./ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./ui/tooltip";
import { useUniversalUser } from '@/hooks/useUniversalUser';
import QuickSettingsPanel from './QuickSettingsPanel';
const UserProfileDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  
  // Safe auth access with early return
  let authContext, secureRolesContext, universalUserContext;
  try {
    authContext = useAuth();
    secureRolesContext = useSecureRoles();
    universalUserContext = useUniversalUser(authContext?.user?.id);
  } catch (error) {
    console.warn('UserProfileDropdown: Auth context not ready yet');
    return null;
  }
  
  const { user, userProfile, signOut } = authContext;
  const { currentUserRole, isSuperAdmin, isAdmin } = secureRolesContext;
  const { displayName, role: universalRole } = universalUserContext;
  const navigate = useNavigate();

  // Debug logging for admin access
  const isPlatformOwner =
    (userProfile?.primary_role === 'platform_owner_root') ||
    (currentUserRole === 'platform_owner_root') ||
    (universalRole === 'platform_owner_root');
  const hasAdminAccess =
    isPlatformOwner || isSuperAdmin || isAdmin ||
    universalRole === 'admin' || universalRole === 'super_admin';
  console.log('🔍 UserProfileDropdown Debug:', {
    userId: user?.id,
    currentUserRole,
    isSuperAdmin,
    isAdmin,
    isPlatformOwner,
    userPrimaryRole: userProfile?.primary_role,
    universalRole,
    hasAdminAccess
  });
  const handleLinkClick = (path: string) => {
    setOpen(false);
    setShowQuickSettings(false);
    navigate(path);
  };
  const handleLogout = async () => {
    console.log('🚪 Logout clicked in dropdown');
    setOpen(false);
    setShowQuickSettings(false);
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
      console.log('Auto-navigation prevented - staying on current page');
    }
  };
  const menuItemClasses = "group flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors hover:text-red-900 hover:bg-gradient-to-r hover:from-red-200 hover:via-red-400 hover:to-red-600";
  const menuItemJustifyBetweenClasses = "group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors hover:text-red-900 hover:bg-gradient-to-r hover:from-red-200 hover:via-red-400 hover:to-red-600";
  return <div className="relative my-0 py-0 mx-0 mt-1">
      <TooltipProvider delayDuration={0}>
        <Tooltip open={showTooltip}>
          <Popover open={open} onOpenChange={setOpen}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button className="h-12 w-12 rounded-full bg-gray-300 hover:bg-gray-500 transition-colors duration-100" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
                  <Avatar size="lg" className="h-12 w-12" />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            
            <PopoverContent className="w-80 p-0 rounded-xl shadow-lg border-none z-[1000]" align="end" sideOffset={12}>
              <div className="bg-white rounded-xl overflow-hidden text-gray-800 relative">
                {/* Main content */}
                <div className={`transition-transform duration-300 ${showQuickSettings ? '-translate-x-full' : 'translate-x-0'}`}>
                  <div onClick={() => handleLinkClick('/profile')} className="group p-3 flex items-center justify-between cursor-pointer transition-colors rounded-t-xl hover:text-red-900 hover:bg-gradient-to-r hover:from-red-200 hover:via-red-400 hover:to-red-600">
                    <span className="text-lg font-semibold">{displayName}</span>
                    <Avatar size="sm" />
                  </div>
                
                  <div className="p-2 space-y-0.5">
                      <div className={menuItemClasses}>
                          <svg className="h-5 w-5 text-gray-500 group-hover:text-red-900 transition-colors" viewBox="0 0 484.8 484.8" xmlns="http://www.w3.org/2000/svg">
                            <path style={{fill: '#9E5523'}} d="M482.4,458.4c0,12.8-10.4,23.2-23.2,23.2H25.6c-12.8-0.8-23.2-11.2-23.2-23.2V116.8 c0-12.8,10.4-23.2,23.2-23.2h433.6c12.8,0,23.2,10.4,23.2,23.2L482.4,458.4L482.4,458.4z"/>
                            <path style={{fill: '#442B1B'}} d="M482.4,461.6c0,12.8-10.4,23.2-23.2,23.2H25.6c-12.8,0-23.2-10.4-23.2-23.2V120.8 c0-12.8,10.4-23.2,23.2-23.2h433.6c12.8,0,23.2,10.4,23.2,23.2L482.4,461.6L482.4,461.6z"/>
                            <polygon style={{fill: '#7EAF8A'}} points="395.2,0 2.4,100.8 2.4,215.2 24.8,303.2 445.6,195.2 "/>
                            <polygon style={{fill: '#578C65'}} points="376.8,31.2 2.4,128 2.4,236.8 24,320.8 424.8,217.6 "/>
                            <polyline style={{fill: '#43754F'}} points="424.8,217.6 376.8,31.2 185.6,81.6 2.4,236.8 "/>
                            <path style={{fill: '#914D1F'}} d="M2.4,131.2v330.4c0,12.8,10.4,23.2,23.2,23.2h433.6c12.8,0,23.2-10.4,23.2-23.2V131.2H2.4z"/>
                            <path style={{fill: '#844419'}} d="M459.2,484.8c12.8,0,23.2-10.4,23.2-23.2V131.2H2.4"/>
                            <polygon style={{opacity: 0.3, fill: '#9E5523'}} points="482.4,193.6 449.6,160 424,165.6 404.8,242.4 444.8,255.2 482.4,244.8 "/>
                            <path style={{fill: '#0093F7'}} d="M453.6,374.4c0,8.8-7.2,16.8-16.8,16.8H48c-8.8,0-16.8-7.2-16.8-16.8V169.6c0-8.8,7.2-16.8,16.8-16.8 h388.8c8.8,0,16.8,7.2,16.8,16.8L453.6,374.4L453.6,374.4z"/>
                            <path style={{fill: '#0580E5'}} d="M31.2,169.6c0-8.8,7.2-16.8,16.8-16.8h388.8c8.8,0,16.8,7.2,16.8,16.8v204c0,8.8-7.2,16.8-16.8,16.8"/>
                            <path style={{fill: '#24D1FF'}} d="M31.2,169.6c0-8.8,7.2-16.8,16.8-16.8h388.8c8.8,0,16.8,7.2,16.8,16.8"/>
                            <path style={{fill: '#AA5D29'}} d="M2.4,198.4v263.2c0,12.8,10.4,23.2,23.2,23.2h433.6c12.8,0,23.2-10.4,23.2-23.2V198.4H2.4z"/>
                            <path style={{fill: '#9E5523'}} d="M459.2,484.8c12.8,0,23.2-10.4,23.2-23.2V198.4H2.4"/>
                            <polygon style={{opacity: 0.3, fill: '#9E5523'}} points="482.4,263.2 449.6,230.4 424,236 404.8,312 444.8,325.6 482.4,315.2 "/>
                            <path style={{fill: '#12DB55'}} d="M453.6,444.8c0,8.8-7.2,16.8-16.8,16.8H48c-8.8,0-16.8-7.2-16.8-16.8V240c0-8.8,7.2-16.8,16.8-16.8 h388.8c8.8,0,16.8,7.2,16.8,16.8L453.6,444.8L453.6,444.8z"/>
                            <path style={{fill: '#10C146'}} d="M31.2,240c0-8.8,7.2-16.8,16.8-16.8h388.8c8.8,0,16.8,7.2,16.8,16.8v204c0,8.8-7.2,16.8-16.8,16.8"/>
                            <path style={{fill: '#29EF66'}} d="M31.2,240c0-8.8,7.2-16.8,16.8-16.8h388.8c8.8,0,16.8,7.2,16.8,16.8"/>
                            <path style={{fill: '#B56823'}} d="M2.4,267.2v194.4c0,12.8,10.4,23.2,23.2,23.2h433.6c12.8,0,23.2-10.4,23.2-23.2V267.2H2.4z"/>
                            <path style={{fill: '#A85E20'}} d="M31.2,267.2V444c0,8.8,7.2,16.8,16.8,16.8h388.8c8.8,0,16.8-7.2,16.8-16.8V267.2H31.2z"/>
                            <rect x="2.4" y="198.4" style={{fill: '#C67634'}} width="480" height="2.4"/>
                            <rect x="2.4" y="131.2" style={{fill: '#C67634'}} width="480" height="2.4"/>
                            <rect x="2.4" y="267.2" style={{fill: '#C67634'}} width="480" height="2.4"/>
                            <path style={{fill: '#D39754'}} d="M30.4,475.2h-7.2c-0.8,0-1.6-0.8-1.6-1.6c0-0.8,0.8-1.6,1.6-1.6h7.2c0.8,0,1.6,0.8,1.6,1.6 S31.2,475.2,30.4,475.2z"/>
                            <path style={{fill: '#D39754'}} d="M440.8,475.2h-13.6c-0.8,0-1.6-0.8-1.6-1.6c0-0.8,0.8-1.6,1.6-1.6h13.6c0.8,0,1.6,0.8,1.6,1.6 S441.6,475.2,440.8,475.2z M413.6,475.2H400c-0.8,0-1.6-0.8-1.6-1.6c0-0.8,0.8-1.6,1.6-1.6h13.6c0.8,0,1.6,0.8,1.6,1.6 C415.2,474.4,414.4,475.2,413.6,475.2z M386.4,475.2h-13.6c-0.8,0-1.6-0.8-1.6-1.6c0-0.8,0.8-1.6,1.6-1.6h13.6 c0.8,0,1.6,0.8,1.6,1.6S387.2,475.2,386.4,475.2z M358.4,475.2h-13.6c-0.8,0-1.6-0.8-1.6-1.6c0-0.8,0.8-1.6,1.6-1.6h13.6 c0.8,0,1.6,0.8,1.6,1.6C360.8,474.4,360,475.2,358.4,475.2z M331.2,475.2h-13.6c-0.8,0-1.6-0.8-1.6-1.6c0-0.8,0.8-1.6,1.6-1.6h13.6 c0.8,0,1.6,0.8,1.6,1.6S332,475.2,331.2,475.2z M304,475.2h-13.6c-0.8,0-1.6-0.8-1.6-1.6c0-0.8,0.8-1.6,1.6-1.6H304 c0.8,0,1.6,0.8,1.6,1.6S304.8,475.2,304,475.2z M276.8,475.2h-13.6c-0.8,0-1.6-0.8-1.6-1.6c0-0.8,0.8-1.6,1.6-1.6h13.6 c0.8,0,1.6,0.8,1.6,1.6S277.6,475.2,276.8,475.2z M249.6,475.2H236c-0.8,0-1.6-0.8-1.6-1.6c0-0.8,0.8-1.6,1.6-1.6h13.6 c0.8,0,1.6,0.8,1.6,1.6C251.2,474.4,250.4,475.2,249.6,475.2z M221.6,475.2H208c-0.8,0-1.6-0.8-1.6-1.6c0-0.8,0.8-1.6,1.6-1.6h13.6 c0.8,0,1.6,0.8,1.6,1.6C224,474.4,223.2,475.2,221.6,475.2z M194.4,475.2h-13.6c-0.8,0-1.6-0.8-1.6-1.6c0-0.8,0.8-1.6,1.6-1.6h13.6 c0.8,0,1.6,0.8,1.6,1.6S195.2,475.2,194.4,475.2z M167.2,475.2h-13.6c-0.8,0-1.6-0.8-1.6-1.6c0-0.8,0.8-1.6,1.6-1.6h13.6 c0.8,0,1.6,0.8,1.6,1.6C168.8,474.4,168,475.2,167.2,475.2z M140,475.2h-13.6c-0.8,0-1.6-0.8-1.6-1.6c0-0.8,0.8-1.6,1.6-1.6H140 c0.8,0,1.6,0.8,1.6,1.6C141.6,474.4,140.8,475.2,140,475.2z M112.8,475.2H98.4c-0.8,0-1.6-0.8-1.6-1.6c0-0.8,0.8-1.6,1.6-1.6H112 c0.8,0,1.6,0.8,1.6,1.6C114.4,474.4,113.6,475.2,112.8,475.2z M84.8,475.2H71.2c-0.8,0-1.6-0.8-1.6-1.6c0-0.8,0.8-1.6,1.6-1.6h13.6 c0.8,0,1.6,0.8,1.6,1.6C87.2,474.4,85.6,475.2,84.8,475.2z M57.6,475.2H44c-0.8,0-1.6-0.8-1.6-1.6s0.8-1.6,1.6-1.6h13.6 c0.8,0,1.6,0.8,1.6,1.6C59.2,474.4,58.4,475.2,57.6,475.2z"/>
                            <path style={{fill: '#D39754'}} d="M461.6,475.2h-7.2c-0.8,0-1.6-0.8-1.6-1.6c0-0.8,0.8-1.6,1.6-1.6h7.2c0.8,0,1.6,0.8,1.6,1.6 C463.2,474.4,462.4,475.2,461.6,475.2z"/>
                          </svg>
                          <span className="text-sm font-medium">Wallet: $0.00</span>
                      </div>
                      <div className={menuItemClasses}>
                          <Disc className="h-5 w-5 text-gray-500 group-hover:text-red-900 transition-colors" />
                          <span className="text-sm font-medium">Points: 0</span>
                      </div>

                      <Separator className="my-1" />

                      <div className={menuItemClasses}>
                          <Zap className="h-5 w-5 text-gray-700 group-hover:text-red-900 transition-colors" />
                          <span className="text-sm font-medium">Upgrade To Pro</span>
                      </div>
                      <div className={menuItemClasses}>
                          <Megaphone className="h-5 w-5 text-gray-700 group-hover:text-red-900 transition-colors" />
                          <span className="text-sm font-medium">Advertising</span>
                      </div>
                      
                      <Separator className="my-1" />

                      <div onClick={() => handleLinkClick('/profile/edit')} className={menuItemClasses}>
                          <Pencil className="h-5 w-5 text-gray-700 group-hover:text-red-900 transition-colors" />
                          <span className="text-sm font-medium">Edit</span>
                      </div>
                      <div onClick={() => handleLinkClick('/settings')} className={menuItemClasses}>
                          <Settings className="h-5 w-5 text-gray-700 group-hover:text-red-900 transition-colors" />
                          <span className="text-sm font-medium">General Setting</span>
                      </div>
                      <div className={menuItemClasses}>
                          <Newspaper className="h-5 w-5 text-gray-700 group-hover:text-red-900 transition-colors" />
                          <span className="text-sm font-medium">Subscriptions</span>
                      </div>
                      {hasAdminAccess && (
                        <>
                          <Separator className="my-1" />
                          <div onClick={() => handleLinkClick('/admin/login')} className={`${menuItemClasses} ${isPlatformOwner ? 'bg-gradient-to-r from-yellow-50 to-red-50 border-2 border-red-300 shadow-sm' : 'bg-gradient-to-r from-purple-50 to-red-50 border border-red-200'}`}>
                              {isPlatformOwner ? (
                                <Crown className="h-5 w-5 text-red-600 group-hover:text-red-900 transition-colors" />
                              ) : isSuperAdmin ? (
                                <Crown className="h-5 w-5 text-red-600 group-hover:text-red-900 transition-colors" />
                              ) : (
                                <Shield className="h-5 w-5 text-blue-600 group-hover:text-red-900 transition-colors" />
                              )}
                              <div className="flex flex-col">
                                  <span className={`text-sm font-medium ${isPlatformOwner ? 'font-bold text-red-700' : ''}`}>
                                    {isPlatformOwner ? '🚀 Platform Owner' : 'Admin Area'}
                                  </span>
                                  <span className="text-xs text-red-600 font-semibold">
                                    {isPlatformOwner ? 'Admin Dashboard Access' : (isSuperAdmin ? '👑 Super Admin' : '🛡️ Admin')}
                                  </span>
                              </div>
                          </div>
                          <Separator className="my-1" />
                        </>
                      )}

                      <Separator className="my-1" />

                      <div onClick={handleLogout} className={menuItemClasses}>
                          <LogOut className="h-5 w-5 text-gray-700 group-hover:text-red-900 transition-colors" />
                          <span className="text-sm font-medium">Log Out</span>
                      </div>

                      <Separator className="my-1" />

                      <div className={menuItemJustifyBetweenClasses}>
                          <span className="text-sm font-medium">Switch Account</span>
                          <RefreshCw className="h-4 w-4 text-gray-600 group-hover:text-red-900 transition-colors" />
                      </div>
                      <div className={menuItemJustifyBetweenClasses}>
                          <span className="text-sm font-medium">Keyboard shortcuts</span>
                          <Command className="h-4 w-4 text-gray-600 group-hover:text-red-900 transition-colors" />
                      </div>
                      <div 
                        onClick={() => setShowQuickSettings(true)}
                        className={menuItemJustifyBetweenClasses}
                      >
                        <span className="text-sm font-medium">Settings and Privacy</span>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 group-hover:text-red-900 transition-colors">
                          <path d="M6 12H18M18 12L13 7M18 12L13 17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                  </div>
                </div>
                
                {/* Quick Settings Panel */}
                {showQuickSettings && (
                  <QuickSettingsPanel onBack={() => setShowQuickSettings(false)} />
                )}
              </div>
            </PopoverContent>
          </Popover>
          <TooltipContent side="top" sideOffset={10} align="end" alignOffset={-15} className="bg-neutral-800/85 text-white border-none px-3 py-1.5 text-sm rounded backdrop-blur-sm z-[100]">
            Llogaria
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>;
};
export default UserProfileDropdown;