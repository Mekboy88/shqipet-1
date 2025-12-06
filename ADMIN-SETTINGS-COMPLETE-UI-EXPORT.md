# ADMIN SETTINGS PAGE - COMPLETE UI EXPORT (100% EXACT CODE)

This document contains the COMPLETE, EXACT code for the Admin Settings page including the Admin Dashboard layout, sidebar, header, and all related components.

---

## 1. src/pages/admin/AdminDashboard.tsx (Main Layout)

```tsx

import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import DashboardSettingsSheet from '@/components/admin/dashboard-settings/DashboardSettingsSheet';
import AdminErrorBoundary from '@/components/admin/AdminErrorBoundary';

import ShqipetAIInterface from '@/components/admin/shqipet/ShqipetAIInterface';
import ChatWindow from '@/components/admin/ChatWindow';

import { SidebarProvider } from '@/components/ui/sidebar';

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const [shqipetModalOpen, setShqipetModalOpen] = useState(false);
  
  console.log('🚀 [DEBUG] AdminDashboard rendering with Luna AI Interface');
  console.log('🔧 [ROUTE-DEBUG] Current admin location:', location.pathname);

  const handleShqipetClick = () => {
    setShqipetModalOpen(true);
  };
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-white overflow-hidden" style={{ borderLeft: 'none' }}>
        {/* Admin Sidebar */}
        <AdminSidebar />
        
        {/* Main Content Area - This is now the scroll container */}
        <div className="flex flex-col flex-1 transition-all duration-300 overflow-y-auto" style={{ borderLeft: 'none', marginLeft: 0 }}>
          {/* Admin Header/Navbar - Sticky at top of scroll container */}
          <div className="sticky top-0 z-30 bg-white">
            <AdminHeader />
          </div>
          
          {/* Content Area with Error Boundary */}
          <div className="flex-1 bg-gray-50 p-6 min-h-0">
            <AdminErrorBoundary>
              <Outlet key={location.pathname} />
            </AdminErrorBoundary>
          </div>
        </div>
        
        {/* Shqipet AI Interface - New Advanced Interface */}
        <ShqipetAIInterface 
          isVisible={shqipetModalOpen} 
          onClose={() => setShqipetModalOpen(false)} 
        />
        
        {/* Dashboard Settings Sheet */}
        <DashboardSettingsSheet />
        
        {/* Chat Window at Bottom of Page */}
        <ChatWindow />
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
```

---

## 2. src/pages/admin/AdminSettings.tsx (Settings Page Content)

```tsx

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, User, Shield, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { immediateLogoutService } from '@/utils/auth/immediateLogoutService';
import { getRoleBadgeConfig } from '@/components/admin/factory/AdminRoleUtils';
import Avatar from '@/components/Avatar';
import { useNavigate } from 'react-router-dom';

const AdminSettings: React.FC = () => {
  const { user, userRole, adminRole } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    console.log('🚪 Admin Settings logout clicked - redirecting to admin login');
    
    // Mark admin logout in session storage
    sessionStorage.setItem('adminLoggedOut', 'true');
    
    // Instant client-side redirect (no white blank page)
    navigate('/admin/login', { replace: true });
  };

  const handleQuickLogin = () => {
    navigate('/admin/login');
  };

  const currentRole = userRole || adminRole || 'user';
  const roleConfig = getRoleBadgeConfig(currentRole);

  return (
    <div className="min-h-screen max-h-screen w-full max-w-full overflow-x-hidden overflow-y-auto bg-background">
      <div className="w-full max-w-full h-full p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="w-full">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2 sm:mb-4">Admin Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your admin account and access settings.</p>
          </div>

          {/* Current User Card */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Current Admin User
              </CardTitle>
              <CardDescription>
                Your current admin session information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <Avatar userId={user?.id} size="lg" className="h-12 w-12 ring-2 ring-primary/20" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {currentRole === 'platform_owner_root' && user?.email 
                      ? `********.${user.email.split('.').pop()}`
                      : user?.email || 'Admin User'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Role: <span className="font-medium" style={{ color: roleConfig.color }}>
                      {roleConfig.text}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-muted-foreground">Active Session</span>
                  </div>
                </div>
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          {/* Session Management Card */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Session Management
              </CardTitle>
              <CardDescription>
                Manage your admin session and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  variant="destructive"
                  className="w-full h-12 text-base font-medium"
                >
                  {isLoggingOut ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Logging Out...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout from Admin
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleQuickLogin}
                  variant="outline"
                  className="w-full h-12 text-base font-medium"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Quick Login Page
                </Button>
              </div>
              
              <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                <p className="text-sm text-muted-foreground">
                  <strong>Admin Logout:</strong> This will redirect you back to the admin login page while keeping your platform authentication intact. 
                  You'll remain logged into the platform but exit the admin area.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
```

---

## 3. src/components/admin/AdminHeader.tsx (Top Navigation Bar)

```tsx

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

  // Global fetch resilience & auto-recovery
  useFetchGuardian();

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
              title={`${displayName || 'Admin'} • ${hookRole ? getRoleBadgeConfig(hookRole).text : 'Verifying role...'}`}
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
                      {getRoleBadgeConfig(hookRole || 'user').text}
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
```

---

## 4. src/components/admin/AdminSidebar.tsx (Left Sidebar)

```tsx

import React from 'react';
import { Sidebar, SidebarContent, SidebarHeader, useSidebar } from '@/components/ui/sidebar';
import AdminSidebarHeader from './AdminSidebarHeader';
import AdminSidebarUserInfo from './AdminSidebarUserInfo';
import AdminSidebarMenu from './AdminSidebarMenu';

const AdminSidebar: React.FC = () => {
  const { open, setOpen } = useSidebar();
  
  const handleSidebarClick = (e: React.MouseEvent) => {
    // Close sidebar when clicking inside it (except on interactive elements)
    if (open && !e.defaultPrevented) {
      setOpen(false);
    }
  };
  
  return (
    <div className="relative">
      <Sidebar 
        className={`${open ? 'w-64' : 'w-16'} transition-all duration-300 ease-out bg-white text-gray-800 overflow-hidden`} 
        collapsible="icon" 
        side="left"
        onClick={handleSidebarClick}
      >
        <SidebarHeader>
          <AdminSidebarHeader />
        </SidebarHeader>

        <SidebarContent className="flex flex-col h-[calc(100vh-56px)] py-[5px] overflow-hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          <style>{`
            .sidebar-content::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="flex-1 overflow-y-auto">
            <AdminSidebarMenu />
          </div>
          <div className="mt-auto">
            <AdminSidebarUserInfo />
          </div>
        </SidebarContent>
      </Sidebar>
    </div>
  );
};

export default AdminSidebar;
```

---

## 5. src/components/admin/AdminSidebarHeader.tsx

```tsx

import React from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import AdminSidebarLogo from './AdminSidebarLogo';

const AdminSidebarHeader: React.FC = () => {
  const { open } = useSidebar();
  
  return (
    <div className="h-14 flex items-center justify-center border-b border-gray-200 overflow-hidden transition-all duration-300 ease-out">
      <AdminSidebarLogo open={open} />
    </div>
  );
};

export default AdminSidebarHeader;
```

---

## 6. src/components/admin/AdminSidebarLogo.tsx

```tsx

import React from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { Logo } from '@/components/common/Logo';

interface AdminSidebarLogoProps {
  open: boolean;
}

const AdminSidebarLogo: React.FC<AdminSidebarLogoProps> = ({ open }) => {
  const { setOpen } = useSidebar();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent sidebar click handler
    setOpen(!open); // Toggle sidebar state
  };

  return (
    <div className="flex items-center justify-center relative w-full h-12">
      {/* Single logo container with overflow hidden for smooth sliding */}
      <div 
        onClick={handleLogoClick}
        className="cursor-pointer h-12 flex items-center justify-center overflow-hidden"
        style={{ width: open ? '200px' : '48px' }} // Smooth width transition
      >
        <div 
          className="transition-transform duration-300 ease-out flex items-center justify-center h-full"
          style={{
            transform: open ? 'translateX(0px)' : 'translateX(-152px)', // Slide to show only "S"
            width: '200px' // Fixed width for the text container
          }}
        >
          <span className="logo-text admin-logo-text">
            <span className="inline-block text-[32px] font-bold font-cinzel whitespace-nowrap">
              {Array.from('Shqipet').map((char, i) => (
                <span 
                  key={i} 
                  className="inline-block hover:text-rose-500 transition-colors"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {char}
                </span>
              ))}
            </span>
          </span>
        </div>
        
        {/* Standalone S letter that appears when sidebar is closed */}
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-out ${
            open ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <span className="logo-text admin-logo-text text-[32px] font-bold font-cinzel hover:text-rose-500 transition-colors cursor-pointer">
            S
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebarLogo;
```

---

## 7. src/components/admin/AdminSidebarUserInfo.tsx

```tsx
import React from 'react';
import Avatar from "@/components/Avatar";
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/components/ui/sidebar';
import { getRoleBadgeConfig } from '@/components/admin/factory/AdminRoleUtils';

const AdminSidebarUserInfo: React.FC = () => {
  const { user, userRole } = useAuth();
  const { open } = useSidebar();
  
  // SECURITY FIX: Use database-driven role check instead of hardcoded email
  const isPlatformOwner = userRole === 'platform_owner_root';
  
  // Use the centralized role data
  const effectiveRole = userRole || 'user';
  const roleText = getRoleBadgeConfig(effectiveRole).text;
  const roleColor = getRoleBadgeConfig(effectiveRole).color;
  
  // Mask email for platform owner only if role is platform_owner_root
  const displayEmail = isPlatformOwner && user?.email 
    ? `********${user.email.substring(user.email.lastIndexOf('.'))}`
    : user?.email;
  
  console.log('🔐 [SECURITY] Sidebar role detection:', { 
    email: user?.email, 
    userRole, 
    effectiveRole, 
    roleText 
  });
  if (!open) {
    return (
      <div className="fixed bottom-4 left-2 z-10">
        <Avatar userId={user?.id} size="sm" className="h-8 w-8 border-2 border-gray-200" />
      </div>
    );
  }
  return <div className="mt-auto mb-4 py-2 slide-in-userinfo px-[2px]">
      <div className="flex items-center space-x-3 relative">
        {/* User Avatar */}
        <div className="relative">
          <Avatar userId={user?.id} size="md" className="h-10 w-10 border-2 border-gray-200" />
        </div>
        
        {/* User Info */}
        <div className="flex-grow">
          <div className="p-2 rounded-lg bg-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 slide-text truncate">{displayEmail}</p>
                <p className="text-xs slide-text" style={{ color: roleColor }}>{roleText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default AdminSidebarUserInfo;
```

---

## 8. src/components/admin/AdminLayout.tsx

```tsx

import React from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  title = "Dashboard", 
  subtitle = "Welcome to the admin panel" 
}) => {
  return (
    <div className="w-full px-4 md:px-6 mx-auto">
      <div className="space-y-4 w-full">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
```

---

## 9. src/components/admin/AdminErrorBoundary.tsx

```tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class AdminErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;
  
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 [ADMIN-ERROR] Error caught by boundary:', error);
    
    // NEVER show error screens in admin panel - always recover gracefully
    console.log('🔄 [ADMIN-ERROR] Admin panel error detected, recovering gracefully...');
    return { hasError: false }; // Never show error screen in admin
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [ADMIN-ERROR] Component stack:', errorInfo.componentStack);
    console.error('🚨 [ADMIN-ERROR] Error details:', { error, errorInfo });
    
    this.setState({ errorInfo });
    
    // Auto-retry mechanism for transient errors
    if (this.retryCount < this.maxRetries && this.isTransientError(error)) {
      console.log(`🔄 [ADMIN-ERROR] Attempting auto-retry ${this.retryCount + 1}/${this.maxRetries}`);
      this.retryCount++;
      
      setTimeout(() => {
        this.handleReset();
      }, 2000 * this.retryCount); // Exponential backoff
    }
  }

  isTransientError = (error: Error): boolean => {
    const transientErrorMessages = [
      'network',
      'timeout',
      'connection',
      'fetch',
      'loading',
      'temporary'
    ];
    
    return transientErrorMessages.some(msg => 
      error.message?.toLowerCase().includes(msg)
    );
  };

  handleReset = () => {
    console.log('🔄 [ADMIN-ERROR] Resetting error boundary');
    this.retryCount = 0;
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-6 w-6" />
                Admin Panel Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Something went wrong in the admin panel. Please try refreshing or contact support if the issue persists.
                </AlertDescription>
              </Alert>
              
              {this.state.error && (
                <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                  <strong>Error:</strong> {this.state.error.message}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={this.handleReset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log('Admin refresh button clicked - Auto-refresh prevented!');
                    // Never reload automatically
                  }}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Auto-Refresh Disabled
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
```

---

## 10. src/components/admin/factory/AdminRoleUtils.ts

```tsx

export interface RoleBadgeConfig {
  text: string;
  color: string;
  accessLevel: string;
}

export const getRoleBadgeConfig = (role: string): RoleBadgeConfig => {
  switch(role) {
    case 'platform_owner_root':
      return {
        text: 'Platform Owner',
        color: '#7C2D12',
        accessLevel: 'Ultimate System Authority'
      };
    case 'super_admin':
      return {
        text: 'Super Admin',
        color: '#E17B7B',
        accessLevel: 'Advanced System Access & Management'
      };
    case 'org_admin':
      return {
        text: 'Org Admin',
        color: '#DC2626',
        accessLevel: 'Organizational Management'
      };
    case 'access_admin':
      return {
        text: 'Access Admin',
        color: '#EA580C',
        accessLevel: 'Role & Permission Management'
      };
    case 'security_admin':
      return {
        text: 'Security Admin',
        color: '#D97706',
        accessLevel: 'Security Policy Management'
      };
    case 'global_content_moderator':
      return {
        text: 'Global Moderator',
        color: '#059669',
        accessLevel: 'Global Content Moderation'
      };
    case 'posts_moderator':
    case 'comments_moderator':
    case 'media_moderator':
      return {
        text: 'Content Moderator',
        color: '#0891B2',
        accessLevel: 'Content Moderation & Review'
      };
    case 'user_directory_admin':
      return {
        text: 'User Admin',
        color: '#7C3AED',
        accessLevel: 'User Management & Directory'
      };
    case 'api_admin':
      return {
        text: 'API Admin',
        color: '#2563EB',
        accessLevel: 'API & Integration Management'
      };
    case 'database_admin':
      return {
        text: 'Database Admin',
        color: '#1D4ED8',
        accessLevel: 'Database Operations'
      };
    case 'read_only_global_admin':
      return {
        text: 'Read-Only Admin',
        color: '#64748B',
        accessLevel: 'Global Read Access'
      };
    case 'user':
      return {
        text: 'User',
        color: '#6B7280',
        accessLevel: 'Standard User Access'
      };
    default:
      // Handle any other role codes
      const formattedRole = role.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      return {
        text: formattedRole,
        color: '#6B7280',
        accessLevel: 'Administrative Access'
      };
  }
};
```

---

## 11. src/components/ui/ThemeToggle.tsx

```tsx
import React from 'react';
import { Sun, Palette, Coffee, Snowflake, Flame, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';

const themeConfig = {
  'light-blue': {
    name: 'Ocean Blue',
    icon: Sun,
    preview: 'bg-blue-500',
    description: 'Clean blue theme'
  },
  'red': {
    name: 'Red Theme', 
    icon: Flame,
    preview: 'bg-red-500',
    description: 'Bold red theme'
  },
  'milky-honey': {
    name: 'Honey Glow',
    icon: Coffee,
    preview: 'bg-amber-500',
    description: 'Warm honey colors'
  },
  'minimal-white': {
    name: 'Pure White',
    icon: Palette,
    preview: 'bg-gray-700',
    description: 'Minimal white design'
  },
  'pure-white': {
    name: 'Snow White',
    icon: Circle,
    preview: 'bg-white border border-gray-300',
    description: 'Pure white with no colors'
  }
} as const;

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  const currentTheme = themeConfig[theme] || themeConfig['light-blue']; // Fallback to default theme
  const CurrentIcon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full transition-all duration-200 hover:scale-105 
                     hover:bg-white/80 hover:shadow-lg hover:shadow-black/10 
                     backdrop-blur-sm border border-white/20 
                     bg-white/50 shadow-sm contain-layout will-change-transform"
          title="Switch Theme"
        >
          <CurrentIcon className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {Object.entries(themeConfig).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = theme === key;
          
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => setTheme(key as ThemeMode)}
              className={`flex items-center gap-3 cursor-pointer transition-all duration-100 ${
                isActive ? 'bg-primary/10 text-primary' : ''
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${config.preview}`} />
              <Icon className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">{config.name}</div>
                <div className="text-xs text-muted-foreground">{config.description}</div>
              </div>
              {isActive && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

---

## NOTE

This export contains the core Admin Settings page UI. There are additional nested components (AdminSidebarMenu, menu items, ChatWindow, ShqipetAIInterface, MessageDropdown, AdminInbox, etc.) that are used within these components. The full codebase has 50+ additional admin component files.

If you need ANY additional component code, please ask specifically for those files.
