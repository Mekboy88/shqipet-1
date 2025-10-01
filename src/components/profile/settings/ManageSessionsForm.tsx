
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet, Laptop, X, Clock, Loader2, AlertTriangle, Shield, ShieldCheck } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDeviceSession } from '@/hooks/useDeviceSession';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ManageSessionsForm: React.FC = () => {
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false);
  const { signOut } = useAuth();
  
  const {
    trustedDevices,
    currentDeviceId,
    loading,
    toggleDeviceTrust,
    removeDevice
  } = useDeviceSession();

  // Get device-specific colors and styles
  const getDeviceStyles = (deviceType: string, isCurrentDevice: boolean, isTrusted: boolean) => {
    const baseStyles = {
      smartphone: {
        borderColor: isCurrentDevice ? 'border-blue-400' : 'border-blue-300',
        bgColor: isCurrentDevice ? 'bg-blue-100' : 'bg-blue-50',
        iconColor: 'text-blue-600',
        iconBg: isCurrentDevice ? 'bg-blue-200' : 'bg-blue-100',
        statusColor: isCurrentDevice ? 'bg-blue-600' : 'bg-blue-500',
        statusText: isCurrentDevice ? 'text-blue-800' : 'text-blue-700',
        ringColor: isCurrentDevice ? 'ring-4 ring-blue-200' : ''
      },
      tablet: {
        borderColor: isCurrentDevice ? 'border-purple-400' : 'border-purple-300',
        bgColor: isCurrentDevice ? 'bg-purple-100' : 'bg-purple-50',
        iconColor: 'text-purple-600',
        iconBg: isCurrentDevice ? 'bg-purple-200' : 'bg-purple-100',
        statusColor: isCurrentDevice ? 'bg-purple-600' : 'bg-purple-500',
        statusText: isCurrentDevice ? 'text-purple-800' : 'text-purple-700',
        ringColor: isCurrentDevice ? 'ring-4 ring-purple-200' : ''
      },
      laptop: {
        borderColor: isCurrentDevice ? 'border-green-400' : 'border-green-300',
        bgColor: isCurrentDevice ? 'bg-green-100' : 'bg-green-50',
        iconColor: 'text-green-600',
        iconBg: isCurrentDevice ? 'bg-green-200' : 'bg-green-100',
        statusColor: isCurrentDevice ? 'bg-green-600' : 'bg-green-500',
        statusText: isCurrentDevice ? 'text-green-800' : 'text-green-700',
        ringColor: isCurrentDevice ? 'ring-4 ring-green-200' : ''
      },
      desktop: {
        borderColor: isCurrentDevice ? 'border-gray-500' : 'border-gray-400',
        bgColor: isCurrentDevice ? 'bg-gray-200' : 'bg-gray-100',
        iconColor: 'text-gray-700',
        iconBg: isCurrentDevice ? 'bg-gray-300' : 'bg-gray-200',
        statusColor: isCurrentDevice ? 'bg-gray-700' : 'bg-gray-600',
        statusText: isCurrentDevice ? 'text-gray-900' : 'text-gray-800',
        ringColor: isCurrentDevice ? 'ring-4 ring-gray-300' : ''
      },
      unknown: {
        borderColor: isCurrentDevice ? 'border-orange-400' : 'border-orange-300',
        bgColor: isCurrentDevice ? 'bg-orange-100' : 'bg-orange-50',
        iconColor: 'text-orange-600',
        iconBg: isCurrentDevice ? 'bg-orange-200' : 'bg-orange-100',
        statusColor: isCurrentDevice ? 'bg-orange-600' : 'bg-orange-500',
        statusText: isCurrentDevice ? 'text-orange-800' : 'text-orange-700',
        ringColor: isCurrentDevice ? 'ring-4 ring-orange-200' : ''
      }
    };

    const style = baseStyles[deviceType] || baseStyles.unknown;
    
    // Add trusted device styling
    if (isTrusted && !isCurrentDevice) {
      style.borderColor = style.borderColor.replace('300', '400');
      style.bgColor = style.bgColor.replace('50', '75');
    }

    return style;
  };

  // Get device icon based on device type
  const getDeviceIcon = (deviceType: string, iconColor: string) => {
    const iconProps = { className: iconColor, size: 28 };
    
    switch (deviceType) {
      case 'smartphone':
        return <Smartphone {...iconProps} />;
      case 'tablet':
        return <Tablet {...iconProps} />;
      case 'laptop':
        return <Laptop {...iconProps} />;
      case 'desktop':
        return <Monitor {...iconProps} />;
      default:
        return <Monitor {...iconProps} />;
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
  };

  // Logout from all other devices
  const handleLogoutAll = async () => {
    try {
      setLogoutAllLoading(true);
      
      const otherDevices = trustedDevices.filter(device => device.id !== currentDeviceId);
      
      for (const device of otherDevices) {
        await removeDevice(device.id);
      }
      
      toast.success(`Successfully logged out from ${otherDevices.length} other device${otherDevices.length !== 1 ? 's' : ''}`);
      setShowLogoutAllDialog(false);
      
    } catch (error) {
      console.error('Error in handleLogoutAll:', error);
      toast.error('Failed to logout from other devices');
    } finally {
      setLogoutAllLoading(false);
    }
  };

  // Remove specific device
  const handleRemoveDevice = async (deviceId: string) => {
    try {
      setRemovingDeviceId(deviceId);
      
      // Check if this is the current device
      if (deviceId === currentDeviceId) {
        // If removing current device, logout completely
        toast.success('Logging out current session...');
        await signOut();
        return;
      }
      
      await removeDevice(deviceId);
      
    } catch (error) {
      console.error('Error in handleRemoveDevice:', error);
      toast.error('Failed to remove device');
    } finally {
      setRemovingDeviceId(null);
    }
  };

  // Toggle device trust
  const handleToggleTrust = async (deviceId: string, currentTrust: boolean) => {
    await toggleDeviceTrust(deviceId, !currentTrust);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          <span className="ml-2 text-gray-600">Loading trusted devices...</span>
        </div>
      </div>
    );
  }

  const otherDevicesCount = trustedDevices.filter(device => device.id !== currentDeviceId).length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Trusted Devices & Sessions Card */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-3">
              Trusted Devices & Sessions
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Manage your trusted devices and active login sessions. Each device you log in with will be remembered and displayed here.
            </p>
          </div>
          
          <AlertDialog open={showLogoutAllDialog} onOpenChange={setShowLogoutAllDialog}>
            <AlertDialogTrigger asChild>
              <Button 
                disabled={logoutAllLoading || trustedDevices.length <= 1 || otherDevicesCount === 0}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white border-red-500 font-medium transition-all duration-200 hover:shadow-md rounded-md"
              >
                {logoutAllLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Logging out...
                  </>
                ) : (
                  'Logout All Other Devices'
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Logout From All Other Devices?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    This action will log you out from <strong>{otherDevicesCount} other device{otherDevicesCount !== 1 ? 's' : ''}</strong> where you're currently signed in.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>What will happen:</strong>
                    </p>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1 list-disc list-inside">
                      <li>All other devices will be signed out immediately</li>
                      <li>You'll need to sign in again on those devices</li>
                      <li>Your current device will remain signed in</li>
                      <li>Device records will be kept for security purposes</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogoutAll}
                  className="bg-red-500 hover:bg-red-600"
                  disabled={logoutAllLoading}
                >
                  {logoutAllLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Logging out...
                    </>
                  ) : (
                    `Yes, Logout ${otherDevicesCount} Device${otherDevicesCount !== 1 ? 's' : ''}`
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        {trustedDevices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {trustedDevices.map((device) => {
              const isCurrentDevice = device.id === currentDeviceId;
              const deviceStyles = getDeviceStyles(device.device_type, isCurrentDevice, device.is_trusted);
              
              return (
                <div 
                  key={device.id} 
                  className={`p-6 rounded-xl border-2 shadow-lg relative group transition-all hover:shadow-xl hover:scale-105 ${deviceStyles.borderColor} ${deviceStyles.bgColor} ${deviceStyles.ringColor}`}
                >
                  <div className="absolute top-4 right-4 flex gap-2">
                    {!isCurrentDevice && (
                      <button
                        onClick={() => handleToggleTrust(device.id, device.is_trusted)}
                        className={`p-2 rounded-full transition-all ${
                          device.is_trusted 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {device.is_trusted ? <ShieldCheck size={16} /> : <Shield size={16} />}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleRemoveDevice(device.id)}
                      disabled={removingDeviceId === device.id}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-white hover:bg-red-50 rounded-full w-8 h-8 flex items-center justify-center shadow-md disabled:opacity-50"
                    >
                      {removingDeviceId === device.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <X size={18} />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center mb-5">
                    <div className={`p-4 rounded-xl mr-5 ${deviceStyles.iconBg} shadow-sm transition-all duration-200 hover:shadow-md`}>
                      {getDeviceIcon(device.device_type, deviceStyles.iconColor)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold text-lg ${deviceStyles.statusText}`}>
                          {device.device_name}
                        </h4>
                        {device.is_trusted && !isCurrentDevice && (
                          <ShieldCheck size={16} className="text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-medium">
                        {device.browser_info} on {device.operating_system}
                      </p>
                      {isCurrentDevice && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium mt-1 inline-block">
                          Current Session
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-700 space-y-3 pl-1">
                    <div className="flex items-center">
                      <Clock size={16} className="mr-3 flex-shrink-0 text-gray-500" />
                      <span className="font-medium">Last seen: {formatTimeAgo(device.last_seen)}</span>
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="bg-white/60 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                        First seen: {new Date(device.first_seen).toLocaleDateString()}
                      </p>
                      <p className="bg-white/60 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                        Login count: {device.login_count} time{device.login_count !== 1 ? 's' : ''}
                      </p>
                      {device.location && (
                        <p className="bg-white/60 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                          Location: {device.location}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center mt-3 pt-2 border-t border-white/30">
                      <div className={`w-3 h-3 rounded-full mr-3 ${deviceStyles.statusColor} shadow-sm`}></div>
                      <span className={`text-sm font-bold ${deviceStyles.statusText}`}>
                        {isCurrentDevice ? 'Current Device' : device.is_trusted ? 'Trusted Device' : 'Logged In Device'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-lg">
            <div className="p-4 rounded-xl bg-gray-100 shadow-sm transition-all duration-200 hover:shadow-md w-fit mx-auto mb-4">
              <Monitor size={48} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No devices found.</p>
            <p className="text-sm text-gray-400 mt-2">Login from different devices to see them appear here as trusted devices.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSessionsForm;
