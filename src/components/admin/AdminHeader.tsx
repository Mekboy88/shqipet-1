
import React, { useState, useEffect, useRef } from 'react';
import AdminSettingsIcon from '@/components/ui/AdminSettingsIcon';
import Avatar from "@/components/Avatar";
import { Search, LogOut, Settings, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/components/ui/sidebar';
import { useUniversalUser } from '@/hooks/useUniversalUser';
import { authLogger } from '@/utils/auth/authLogger';
import { immediateLogoutService } from '@/utils/auth/immediateLogoutService';
import UnifiedAIWidget from './UnifiedAIWidget';
import MessageDropdown from './MessageDropdown';
import { useFetchGuardian } from '@/hooks/useFetchGuardian';
// Database integration removed - placeholder for future Cloud integration
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { getRoleBadgeConfig } from '@/components/admin/factory/AdminRoleUtils';

interface AdminHeaderProps {
  // Removed Luna props
}

const AdminHeader: React.FC<AdminHeaderProps> = () => {
  const { user, adminRole } = useAuth();
  const { userRole: hookRole } = useAuth();
  const { open } = useSidebar();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Notification state
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      message: "New user registration request", 
      type: "info", 
      time: "2 min ago", 
      unread: true 
    },
    { 
      id: 2, 
      message: "System backup completed successfully", 
      type: "success", 
      time: "1 hour ago", 
      unread: true 
    },
    { 
      id: 3, 
      message: "Security alert: Multiple failed login attempts", 
      type: "warning", 
      time: "3 hours ago", 
      unread: false 
    }
  ]);
  
  // Use the global avatar system - never show loading
  const { avatarUrl, initials, displayName } = useUniversalUser();
  const [role, setRole] = useState<string | null>(null);
  const [profileRole, setProfileRole] = useState<string | null>(null);

  // Global fetch resilience & auto-recovery
  useFetchGuardian();

  // Precisely identify current role (super_admin/admin/etc.)
  useEffect(() => {
    let active = true;
    const fetchRole = async () => {
      try {
        console.log('🔐 [SECURITY] AdminHeader role detection starting...');
        
        // Database integration removed - placeholder for future Cloud integration
        const userId = null;
        const userEmail = null;
        
        console.log('🔐 [SECURITY] Auth user detected:', { userId: userId?.substring(0, 8) + '...', email: userEmail });
        
        if (!userId) {
          console.error('🚨 [SECURITY CRITICAL] No authenticated user found!');
          if (active) {
            setRole(null);
            setProfileRole(null);
          }
          return;
        }

        // SECURITY FIX: Removed hardcoded platform owner check
        // All role verification now done through database queries

        // Database integration removed - placeholder for future Cloud integration
        console.log('🔐 [SECURITY] Database integration removed');
        const profileData = null;
        const profileError = new Error('Database not connected');

        console.log('🔐 [SECURITY] Profile query result:', { data: profileData, error: profileError });

        if (profileData?.primary_role) {
          console.log('🔐 [SECURITY] Found profile role:', profileData.primary_role);
          if (active) {
            setProfileRole(profileData.primary_role);
            setRole(profileData.primary_role);
          }
          return;
        }

        // Database integration removed - placeholder for future Cloud integration
        console.log('🔐 [SECURITY] Database integration removed');
        const data = null;
        const error = new Error('Database not connected');
        
        console.log('🔐 [SECURITY] RPC result:', { data, error: error?.message });
        
        if (!error && data) {
          console.log('🔐 [SECURITY] Found RPC role:', data);
          if (active) setRole(data as string);
          return;
        }

        console.warn('🚨 [SECURITY WARNING] RPC get_current_user_role failed; falling back to tables:', error?.message);

        // Database integration removed - placeholder for future Cloud integration
        const linkRows = [];
        const linkErr = new Error('Database not connected');

        if (linkErr) {
          console.warn('Fallback role link query failed:', linkErr.message);
          if (active) setRole(null);
          return;
        }

        const roleIds = Array.isArray(linkRows) ? (linkRows as any[]).map(r => r.role_id).filter(Boolean) : [];
        if (!roleIds.length) {
          if (active) setRole(null);
          return;
        }

        // Database integration removed - placeholder for future Cloud integration
        const roleRows = [];
        const rolesErr = new Error('Database not connected');

        if (rolesErr) {
          console.warn('Fallback roles fetch failed:', rolesErr.message);
          if (active) setRole(null);
          return;
        }

        const best = Array.isArray(roleRows) ? (roleRows as any[]).sort((a,b) => (b.level||0)-(a.level||0))[0] : null;
        if (active) setRole(best?.code || null);
        
        console.error('🚨 [SECURITY WARNING] Had to use fallback role detection method');
      } catch (e) {
        console.error('🚨 [SECURITY CRITICAL] Role fetch failed:', e);
        if (active) {
          setRole(null);
          setProfileRole(null);
        }
      }
    };
    
    console.log('🔐 [SECURITY] Initializing role detection...');
    fetchRole();
    // Database integration removed - placeholder for future Cloud integration
    console.log('🔐 [SECURITY] Database integration removed');
    
    return () => {
      active = false;
    };
  }, []);

  const handleAdminLogout = async () => {
    if (isLoggingOut) return;
    
    console.log('🚪 Admin logout clicked - redirecting to admin login');
    
    // IMMEDIATE visual feedback
    setIsLoggingOut(true);
    setDropdownOpen(false);
    
    // Mark admin logout in session storage for immediate recognition
    sessionStorage.setItem('adminLoggedOut', 'true');
    
    // Smooth client-side navigation to avoid white blank page
    navigate('/admin/login', { replace: true });
  };


  const handleModalMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  // Add global mouse event listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        // Simple drag calculation - just follow the mouse relative to viewport center
        const newX = e.clientX - window.innerWidth / 2 - dragOffset.x;
        const newY = e.clientY - window.innerHeight / 2 - dragOffset.y;
        
        setDragPosition({ x: newX, y: newY });
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleModalMouseUp = () => {
    setIsDragging(false);
  };

  const handleVoiceInput = (text: string) => {
    // Process voice input without opening Luna AI automatically
    console.log('Voice input received:', text);
    // You can add voice processing logic here if needed
  };

  return (
    <header className="h-20 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200/60 flex items-center justify-between px-6 shadow-lg backdrop-blur-sm relative overflow-hidden">
      {/* Subtle Smoke Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-2 left-1/4 w-16 h-16 bg-gradient-to-br from-gray-200/20 to-transparent rounded-full blur-xl animate-smoke-drift" style={{ animationDelay: '0s', animationDuration: '8s' }}></div>
        <div className="absolute top-4 right-1/3 w-12 h-12 bg-gradient-to-br from-blue-200/15 to-transparent rounded-full blur-lg animate-smoke-particle" style={{ animationDelay: '2s', animationDuration: '6s' }}></div>
        <div className="absolute top-6 left-1/2 w-20 h-8 bg-gradient-to-r from-gray-100/10 to-transparent rounded-full blur-2xl animate-subtle-haze" style={{ animationDelay: '1s', animationDuration: '10s' }}></div>
        <div className="absolute top-3 right-1/4 w-14 h-14 bg-gradient-to-bl from-gray-300/15 to-transparent rounded-full blur-xl animate-smoke-drift" style={{ animationDelay: '4s', animationDuration: '7s' }}></div>
      </div>
      {/* Left side - Elegant Title */}
      <div className="flex items-center gap-3">
        <AdminSettingsIcon size={32} className="flex-shrink-0" />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-600 to-slate-800 bg-clip-text text-transparent tracking-tight">
          Admin Settings
        </h1>
        <svg height="32px" width="32px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 384 384" xmlSpace="preserve" fill="#000000" transform="matrix(-1, 0, 0, 1, 0, 0)"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path style={{fill:"#044982"}} d="M160,336c0,17.688-14.312,32-32,32H32c-17.68,0-32-14.312-32-32V48c0-17.672,14.32-32,32-32h96 c17.688,0,32,14.328,32,32V336z"></path> <path style={{fill:"#044982"}} d="M384,208c0,17.688-14.312,32-32,32h-96c-17.68,0-32-14.312-32-32V48c0-17.672,14.32-32,32-32h96 c17.688,0,32,14.328,32,32V208z"></path> </g> <path style={{fill:"#2490C6"}} d="M384,58.72V48c0-17.672-14.312-32-32-32h-96c-17.68,0-32,14.328-32,32v160 c0,12.624,7.368,23.432,17.976,28.64C319.136,193.872,370.464,126.2,384,58.72z"></path> <path style={{fill:"#0E6BA5"}} d="M384,58.72V48c0-17.672-14.312-16-32-16h-96c-17.68,0-32-1.672-32,16v160 c0,12.624,7.368,23.432,17.976,28.64C319.136,193.872,370.464,126.2,384,58.72z"></path> <path style={{fill:"#2490C6"}} d="M160,268.832V48c0-17.672-14.312-32-32-32H32C14.32,16,0,30.328,0,48v211.504 C45.504,279.168,102.232,282.84,160,268.832z"></path> <path style={{fill:"#0E6BA5"}} d="M160,268.832V48c0-17.672-14.312-16-32-16H32C14.32,32,0,30.328,0,48v211.504 C45.504,279.168,102.232,282.84,160,268.832z"></path> </g></svg>
      </div>

      {/* Center - Unified AI Widget */}
      <div className="flex-1 flex justify-center max-w-2xl mx-8">
        <UnifiedAIWidget 
          onVoiceInput={handleVoiceInput}
        />
      </div>

      {/* Right side - Search, Notifications, Messages, Settings */}
      <div className="flex items-center space-x-4">
        {/* Enhanced Search */}
        <div className="relative hidden lg:block">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input 
            className="block w-64 bg-white/80 backdrop-blur border border-gray-200 rounded-full py-2.5 pl-11 pr-4 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md" 
            placeholder="Search admin panel..." 
            type="search" 
          />
        </div>
        
        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setNotificationOpen(!notificationOpen)}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </Button>

        {/* Messages Dropdown */}
        <MessageDropdown 
          open={messageOpen} 
          onOpenChange={setMessageOpen} 
        />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Settings/Profile Dropdown */}
        <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative bg-gradient-to-br from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 rounded-full transition-all duration-200 h-10 w-10"
              title={`${displayName || 'Admin'} • ${(role || hookRole || adminRole) ? getRoleBadgeConfig((role || hookRole || adminRole) as string).text : 'Verifying role...'}`}
              data-user-id={user?.id || ''}
            >
              <span className="text-sm font-semibold">
                {initials || (displayName?.split(' ').map(n => n[0]?.toUpperCase()).slice(0,2).join('') || '?')}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0 rounded-xl shadow-xl border-none z-50" align="end" sideOffset={12}>
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <Avatar userId={user?.id} size="lg" className="h-12 w-12 ring-2 ring-white shadow-md" />
                  <div>
                    <p className="font-semibold text-gray-900">{displayName || 'Admin'}</p>
                    <p className="text-sm text-gray-500">
                      {getRoleBadgeConfig((profileRole || role || hookRole || adminRole || 'user') as string).text}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-400">Online</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-2">
                <button 
                  onClick={handleAdminLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">
                    Exit Admin Area
                  </span>
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

    </header>
  );
};

export default AdminHeader;
