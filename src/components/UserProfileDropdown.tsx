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
                          <Wallet className="h-5 w-5 text-gray-500 group-hover:text-red-900 transition-colors" />
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