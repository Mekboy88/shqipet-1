
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet, Laptop, X, Clock, Loader2, AlertTriangle, Shield, ShieldCheck, Info } from 'lucide-react';
import DeviceMapView from './manage-sessions/DeviceMapView';
import DeviceDetailsModal from './manage-sessions/DeviceDetailsModal';
import LiveStatusIndicator from './manage-sessions/LiveStatusIndicator';
import SecurityTipsPanel from './manage-sessions/SecurityTipsPanel';
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
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(true);
  const { signOut } = useAuth();
  
  const {
    trustedDevices,
    currentDeviceId,
    loading,
    error,
    realtimeStatus,
    lastRefresh,
    refreshDevices,
    toggleDeviceTrust,
    removeDevice
  } = useDeviceSession();

  // Get device-specific colors and styles with distinct light colors
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
        borderColor: isCurrentDevice ? 'border-emerald-400' : 'border-emerald-300',
        bgColor: isCurrentDevice ? 'bg-emerald-100' : 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        iconBg: isCurrentDevice ? 'bg-emerald-200' : 'bg-emerald-100',
        statusColor: isCurrentDevice ? 'bg-emerald-600' : 'bg-emerald-500',
        statusText: isCurrentDevice ? 'text-emerald-800' : 'text-emerald-700',
        ringColor: isCurrentDevice ? 'ring-4 ring-emerald-200' : ''
      },
      desktop: {
        borderColor: isCurrentDevice ? 'border-amber-400' : 'border-amber-300',
        bgColor: isCurrentDevice ? 'bg-amber-100' : 'bg-amber-50',
        iconColor: 'text-amber-600',
        iconBg: isCurrentDevice ? 'bg-amber-200' : 'bg-amber-100',
        statusColor: isCurrentDevice ? 'bg-amber-600' : 'bg-amber-500',
        statusText: isCurrentDevice ? 'text-amber-800' : 'text-amber-700',
        ringColor: isCurrentDevice ? 'ring-4 ring-amber-200' : ''
      },
      unknown: {
        borderColor: isCurrentDevice ? 'border-rose-400' : 'border-rose-300',
        bgColor: isCurrentDevice ? 'bg-rose-100' : 'bg-rose-50',
        iconColor: 'text-rose-600',
        iconBg: isCurrentDevice ? 'bg-rose-200' : 'bg-rose-100',
        statusColor: isCurrentDevice ? 'bg-rose-600' : 'bg-rose-500',
        statusText: isCurrentDevice ? 'text-rose-800' : 'text-rose-700',
        ringColor: isCurrentDevice ? 'ring-4 ring-rose-200' : ''
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

  const handleDeviceClick = (deviceId: string) => {
    const device = trustedDevices.find(d => d.id === deviceId);
    if (device) {
      setSelectedDevice(device);
      setShowDeviceModal(true);
    }
  };

  // Monitor realtime connection
  useEffect(() => {
    setRealtimeConnected(realtimeStatus === 'connected');
  }, [realtimeStatus]);

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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Trusted Devices & Sessions Card */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-3">
              Trusted Devices & Sessions
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Manage your trusted devices and active login sessions. Each device you log in with will be remembered and displayed here.
            </p>
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-700 font-medium">Error Loading Devices</p>
                </div>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <Button 
                  onClick={refreshDevices}
                  disabled={loading}
                  className="mt-2 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 border border-red-300"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                  Try Again
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 ml-4">
            <Button 
              onClick={refreshDevices}
              disabled={loading}
              variant="outline"
              className="px-3 py-2 text-sm font-medium transition-all duration-200 hover:shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Refresh Devices'
              )}
            </Button>
            
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

        {/* Live Status Indicator */}
        <div className="mb-6 flex justify-center">
          <LiveStatusIndicator isConnected={realtimeConnected} />
        </div>

        {/* Debug Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg text-xs space-y-1">
            <div><strong>Debug Info:</strong></div>
            <div>User ID: {signOut ? 'Available' : 'None'}</div>
            <div>Devices Count: {trustedDevices.length}</div>
            <div>Current Device: {currentDeviceId || 'None'}</div>
            <div>Real-time: {realtimeStatus}</div>
            <div>Last Refresh: {lastRefresh.toLocaleTimeString()}</div>
            <div>Loading: {loading ? 'Yes' : 'No'}</div>
            <div>Error: {error || 'None'}</div>
          </div>
        )}
        
        {trustedDevices.length > 0 ? (
          <>
            {/* Device Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {trustedDevices.map((device) => {
              const isCurrentDevice = device.id === currentDeviceId;
              const deviceStyles = getDeviceStyles(device.device_type, isCurrentDevice, device.is_trusted);
              
              return (
                <div 
                  key={device.id} 
                  className={`aspect-square p-4 rounded-xl border-2 shadow-lg relative group transition-all hover:shadow-xl hover:scale-[1.02] flex flex-col ${deviceStyles.borderColor} ${deviceStyles.bgColor} ${deviceStyles.ringColor}`}
                >
                  {/* Top actions */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {!isCurrentDevice && (
                      <button
                        onClick={() => handleToggleTrust(device.id, device.is_trusted)}
                        className={`p-1.5 rounded-full transition-all ${
                          device.is_trusted 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {device.is_trusted ? <ShieldCheck size={14} /> : <Shield size={14} />}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleRemoveDevice(device.id)}
                      disabled={removingDeviceId === device.id}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-white hover:bg-red-50 rounded-full w-7 h-7 flex items-center justify-center shadow-md disabled:opacity-50"
                    >
                      {removingDeviceId === device.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <X size={14} />
                      )}
                    </button>
                  </div>
                  
                  {/* Device icon - centered at top */}
                  <div className="flex flex-col items-center mt-6 mb-3">
                    <div className={`p-3 rounded-xl ${deviceStyles.iconBg} shadow-sm transition-all duration-200 hover:shadow-md`}>
                      {getDeviceIcon(device.device_type, deviceStyles.iconColor)}
                    </div>
                  </div>
                  
                   {/* Device info - clickable */}
                  <div 
                    className="flex flex-col items-center text-center mb-3 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDeviceClick(device.id)}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <h4 className={`font-bold text-sm ${deviceStyles.statusText}`}>
                        {device.device_name}
                      </h4>
                      <Info size={12} className="text-gray-400" />
                      {device.is_trusted && !isCurrentDevice && (
                        <ShieldCheck size={12} className="text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      {device.browser_info}
                    </p>
                    <p className="text-xs text-gray-500">
                      {device.operating_system}
                    </p>
                    {isCurrentDevice && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium mt-1">
                        Current
                      </span>
                    )}
                  </div>
                  
                  {/* Details - scrollable if needed */}
                  <div className="text-xs text-gray-700 space-y-2 flex-1 overflow-y-auto">
                    <div className="flex items-center justify-center gap-1">
                      <Clock size={12} className="flex-shrink-0 text-gray-500" />
                      <span className="font-medium truncate">{formatTimeAgo(device.last_seen)}</span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-[11px]">
                        First: {new Date(device.first_seen).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-[11px]">
                        Logins: {device.login_count}
                      </p>
                      {device.location && (
                        <p className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-[11px] truncate" title={device.location}>
                          {device.location}
                        </p>
                      )}
                      {device.ip_address && (
                        <p className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-[11px] font-mono">
                          {device.ip_address}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Status indicator at bottom */}
                  <div className="flex items-center justify-center mt-2 pt-2 border-t border-white/30 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full mr-2 ${deviceStyles.statusColor} shadow-sm`}></div>
                    <span className={`text-[10px] font-bold ${deviceStyles.statusText}`}>
                      {isCurrentDevice ? 'Active' : device.is_trusted ? 'Trusted' : 'Logged In'}
                    </span>
                  </div>
                </div>
              );
            })}
            </div>

            {/* Device Map */}
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                Device Locations
                <span className="text-xs font-normal text-gray-500">(Approximate city-level)</span>
              </h4>
              <DeviceMapView 
                devices={trustedDevices.map(d => ({
                  id: d.id,
                  device_name: d.device_name,
                  device_type: d.device_type,
                  location: d.location,
                  latitude: undefined,
                  longitude: undefined,
                  is_current: d.is_current
                }))}
                onDeviceClick={handleDeviceClick}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-700 mb-2">
              {error ? 'Failed to Load Devices' : 'No devices found'}
            </h4>
            <p className="text-gray-600 max-w-sm mx-auto mb-4">
              {error 
                ? 'There was an error loading your device sessions. Please try refreshing.' 
                : 'Login from different devices to see them appear here as trusted devices.'
              }
            </p>
            <Button 
              onClick={refreshDevices}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Refreshing...
                </>
              ) : (
                'Refresh Devices'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Security Tips Panel */}
      <SecurityTipsPanel />

      {/* Device Details Modal */}
      <DeviceDetailsModal
        device={selectedDevice}
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        onLogout={handleRemoveDevice}
        onToggleTrust={handleToggleTrust}
      />
    </div>
  );
};

export default ManageSessionsForm;
