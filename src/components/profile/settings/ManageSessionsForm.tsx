import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Monitor, Smartphone, Tablet, Laptop, RefreshCw, LogOut, MapPin, Chrome, Globe, Activity, ShieldCheck, Shield, Loader2, AlertTriangle, HelpCircle, Bug, Map, List } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import DeviceMapView from './manage-sessions/DeviceMapView';
import DeviceDetailsModal from './manage-sessions/DeviceDetailsModal';
import SecurityTipsPanel from './manage-sessions/SecurityTipsPanel';
import { useDeviceSession } from '@/hooks/useDeviceSession';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimeAgo } from '@/lib/utils/timeUtils';
import { toast } from 'sonner';
import { deviceSessionService } from '@/services/sessions/DeviceSessionService';

const ManageSessionsForm: React.FC = () => {
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(true);
  const [showDevStrip, setShowDevStrip] = useState(false);
  const [stableId, setStableId] = useState('');
  const [forceRegistering, setForceRegistering] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [lastRegError, setLastRegError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [fixingDeviceId, setFixingDeviceId] = useState<string | null>(null);
  const { signOut, user } = useAuth();
  
  const {
    trustedDevices,
    currentDeviceId,
    currentStableId,
    loading,
    error,
    realtimeStatus,
    lastRefresh,
    refreshDevices,
    toggleDeviceTrust,
    removeDevice,
    logoutAllOtherDevices
  } = useDeviceSession();

  // Ensure current device registers (updates IP/geolocation) when this page is opened
  useEffect(() => {
    if (!user?.id) return;
    
    // Collect diagnostics
    (async () => {
      try {
        const stableDeviceId = await deviceSessionService.getStableDeviceId();
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        const touchPoints = navigator.maxTouchPoints;
        
        setDiagnostics({
          stableDeviceId,
          userAgent: ua,
          platform,
          touchPoints,
          screen: `${screen.width}×${screen.height}`,
          timestamp: new Date().toISOString()
        });
        setStableId(stableDeviceId);
        
        // Attempt registration
        console.log('🔄 Registering device on page load...');
        const sessionId = await deviceSessionService.registerOrUpdateCurrentDevice(user.id);
        
        if (sessionId) {
          console.log('✅ Device registered successfully:', sessionId);
          setLastRegError('');
          await refreshDevices();
        } else {
          console.error('❌ Device registration returned null');
          setLastRegError('Registration returned null - check console for errors');
        }
      } catch (e: any) {
        console.error('❌ Registration failed with exception:', e);
        setLastRegError(e?.message || String(e));
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const getDeviceIcon = (deviceType: string, isActive: boolean = false) => {
    // Dynamic color based on activity
    const colorClass = isActive 
      ? 'text-primary' 
      : 'text-muted-foreground';
    
    const iconProps = { size: 24, className: colorClass };
    switch (deviceType?.toLowerCase()) {
      case 'smartphone':
      case 'mobile':
        return <Smartphone {...iconProps} />;
      case 'tablet':
        return <Tablet {...iconProps} />;
      case 'laptop':
        return <Laptop {...iconProps} />;
      case 'desktop':
        return <Monitor {...iconProps} />;
      case 'unknown':
        return <HelpCircle {...iconProps} />;
      default:
        return <Monitor {...iconProps} />;
    }
  };

  const getFlagEmoji = (countryCode: string): string => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const getBrowserIcon = (browser: string) => {
    const browserLower = browser.toLowerCase();
    const iconProps = { size: 16, className: 'text-muted-foreground' };
    if (browserLower.includes('chrome')) return <Chrome {...iconProps} />;
    if (browserLower.includes('safari')) return <Globe {...iconProps} />;
    if (browserLower.includes('firefox')) return <Activity {...iconProps} />;
    if (browserLower.includes('edge')) return <Globe {...iconProps} />;
    return <Globe {...iconProps} />;
  };

  const getStatusColor = (device: typeof trustedDevices[0]) => {
    const status = device.session_status || (device.is_current ? 'active' : 'logged_in');
    switch (status) {
      case 'active':
        return 'bg-green-500 text-green-600';
      case 'logged_in':
        return 'bg-amber-500 text-amber-500';
      case 'inactive':
        return 'bg-gray-400 text-gray-400';
      default:
        return 'bg-green-500 text-green-600';
    }
  };

  const getStatusText = (device: typeof trustedDevices[0]) => {
    const status = device.session_status || (device.is_current ? 'active' : 'logged_in');
    switch (status) {
      case 'active':
        return 'Active';
      case 'logged_in':
        return 'Logged In';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Active';
    }
  };

  const getDeviceLabel = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'smartphone':
      case 'mobile':
        return 'Mobile';
      case 'tablet':
        return 'Tablet';
      case 'laptop':
        return 'Laptop';
      case 'desktop':
        return 'Desktop';
      default:
        return deviceType || 'Unknown';
    }
  };

  const handleLogoutAll = async () => {
    if (!currentStableId) {
      toast.error('Current device ID not resolved yet. Please wait and try again.');
      return;
    }
    
    try {
      setLogoutAllLoading(true);
      await logoutAllOtherDevices();
      setShowLogoutAllDialog(false);
    } catch (error) {
      console.error('Error in handleLogoutAll:', error);
      toast.error('Failed to logout from other devices');
    } finally {
      setLogoutAllLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    // Find the device to check if it's the current one
    const deviceToRemove = trustedDevices.find(d => d.id === deviceId);
    
    if (!deviceToRemove) {
      toast.error('Device not found');
      return;
    }

    const sessionCount = deviceToRemove.session_count || 1;
    const allStableIds = deviceToRemove.all_stable_ids || [];
    
    // Block if trying to remove current device (by any of its stable IDs)
    if (allStableIds.includes(currentStableId || '')) {
      toast.error('Cannot remove your current device. Please use the logout button instead.');
      return;
    }
    
    try {
      setRemovingDeviceId(deviceId);
      
      if (deviceId === currentDeviceId) {
        toast.success('Logging out current session...');
        await signOut();
        return;
      }
      
      // Show confirmation for multiple sessions
      if (sessionCount > 1) {
        const confirmed = window.confirm(
          `This will log out ${sessionCount} active sessions on this device. Continue?`
        );
        if (!confirmed) {
          setRemovingDeviceId(null);
          return;
        }
      }
      
      await removeDevice(deviceId);
    } catch (error) {
      console.error('Error in handleRemoveDevice:', error);
      toast.error('Failed to remove device');
    } finally {
      setRemovingDeviceId(null);
    }
  };

  const handleToggleTrust = async (deviceId: string, currentTrust: boolean) => {
    await toggleDeviceTrust(deviceId, !currentTrust);
  };

  const openDeviceDetails = (device: any) => {
    setSelectedDevice(device);
    setShowDeviceModal(true);
  };

  const handleFixDeviceType = async (deviceId: string) => {
    if (!user?.id) return;
    
    setFixingDeviceId(deviceId);
    try {
      console.log('🔧 Fixing device type by re-registering...');
      const sessionId = await deviceSessionService.registerOrUpdateCurrentDevice(user.id);
      
      if (sessionId) {
        console.log('✅ Device type fixed and re-registered:', sessionId);
        await refreshDevices();
        toast.success('Device type corrected successfully');
      } else {
        throw new Error('Registration returned null');
      }
    } catch (error: any) {
      console.error('❌ Fix device type failed:', error);
      toast.error(`Failed to fix device type: ${error?.message || String(error)}`);
    } finally {
      setFixingDeviceId(null);
    }
  };

  useEffect(() => {
    setRealtimeConnected(realtimeStatus === 'connected');
  }, [realtimeStatus]);
  
  const handleForceRegister = async () => {
    if (!user?.id) return;
    
    setForceRegistering(true);
    setLastRegError('');
    try {
      console.log('🔄 Force registering device...');
      const sessionId = await deviceSessionService.registerOrUpdateCurrentDevice(user.id);
      
      if (sessionId) {
        console.log('✅ Force registration successful:', sessionId);
        await refreshDevices();
        toast.success('Device registered successfully');
        setLastRegError('');
      } else {
        console.error('❌ Force registration returned null');
        setLastRegError('Registration returned null - check console');
        toast.error('Registration returned null - check console');
      }
    } catch (error: any) {
      console.error('❌ Force register failed:', error);
      const errorMsg = error?.message || String(error);
      setLastRegError(errorMsg);
      toast.error(`Failed to register: ${errorMsg}`);
    } finally {
      setForceRegistering(false);
    }
  };
  
  const copyDiagnostics = () => {
    if (!diagnostics) return;
    
    const text = `Device Diagnostics:
Stable ID: ${diagnostics.stableDeviceId}
User Agent: ${diagnostics.userAgent}
Platform: ${diagnostics.platform}
Touch Points: ${diagnostics.touchPoints}
Screen: ${diagnostics.screen}
Timestamp: ${diagnostics.timestamp}
Last Error: ${lastRegError || 'None'}`;
    
    navigator.clipboard.writeText(text);
    toast.success('Diagnostics copied to clipboard');
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading trusted devices...</span>
        </div>
      </div>
    );
  }

  const otherDevicesCount = trustedDevices.filter(device => {
    // CRITICAL: Use ONLY stable ID (no fallback)
    const deviceStableId = device.device_stable_id;
    return deviceStableId && deviceStableId !== currentStableId;
  }).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Diagnostics Strip - Always visible for debugging */}
      {diagnostics && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-semibold text-blue-500">Device Diagnostics</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">Stable ID:</span>{' '}
                    <span className="font-mono text-[10px]">{diagnostics.stableDeviceId?.substring(0, 20)}...</span>
                  </div>
                  <div>
                    <span className="font-medium">Platform:</span> {diagnostics.platform}
                  </div>
                  <div>
                    <span className="font-medium">Touch:</span> {diagnostics.touchPoints} points
                  </div>
                  <div>
                    <span className="font-medium">Screen:</span> {diagnostics.screen}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">UA:</span>{' '}
                    <span className="font-mono text-[10px]">{diagnostics.userAgent.substring(0, 60)}...</span>
                  </div>
                  {lastRegError && (
                    <div className="col-span-2 text-red-500">
                      <span className="font-medium">Last Error:</span> {lastRegError}
                    </div>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={copyDiagnostics}
                className="shrink-0 h-7 px-2 text-xs"
              >
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Trusted Devices & Sessions
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage your trusted devices and active login sessions across your account. 
            {trustedDevices.length > 0 && (
              <span className="font-semibold"> {trustedDevices.length} device{trustedDevices.length !== 1 ? 's' : ''} registered.</span>
            )}
          </p>
        </div>
        
        {/* Dev Strip - Toggle Button */}
        <div className="flex items-center justify-end mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDevStrip(!showDevStrip)}
            className="text-xs text-muted-foreground h-7"
          >
            <Bug className="w-3 h-3 mr-1" />
            {showDevStrip ? 'Hide' : 'Show'} Dev Info
          </Button>
        </div>
        
        {/* Dev Strip */}
        {showDevStrip && (
          <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-2 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-xs space-y-1">
                <p className="font-mono">
                  <span className="text-muted-foreground">Stable ID:</span>{' '}
                  <span className="font-semibold">
                    {stableId.substring(0, 8)}...{stableId.substring(stableId.length - 8)}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Devices found: <span className="font-semibold text-foreground">{trustedDevices.length}</span>
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleForceRegister}
                disabled={forceRegistering}
                className="text-xs h-8"
              >
                {forceRegistering ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Force Register'
                )}
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex gap-3 mb-6">
          <Button
            onClick={refreshDevices}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2 h-10"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh Devices
          </Button>
          
          <AlertDialog open={showLogoutAllDialog} onOpenChange={setShowLogoutAllDialog}>
            <AlertDialogTrigger asChild>
              <Button
                disabled={logoutAllLoading || trustedDevices.length <= 1 || otherDevicesCount === 0}
                variant="destructive"
                className="flex items-center gap-2 h-10"
              >
                <LogOut size={16} />
                Logout All Other Devices
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Logout From All Other Devices?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    This action will log you out from <strong>{otherDevicesCount} other device{otherDevicesCount !== 1 ? 's' : ''}</strong> where you're currently signed in.
                  </p>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <p className="text-sm text-foreground font-medium">
                      <strong>What will happen:</strong>
                    </p>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                      <li>All other devices will be signed out immediately</li>
                      <li>You'll need to sign in again on those devices</li>
                      <li>Your current device will remain signed in</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogoutAll}
                  className="bg-destructive hover:bg-destructive/90"
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
          <>
            {viewMode === 'list' ? (
              <div className="grid gap-3 mb-6">
                {[...trustedDevices]
                .sort((a, b) => {
                  // Pin current device to top
                  if (a.is_current) return -1;
                  if (b.is_current) return 1;
                  // Then sort by last activity
                  return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime();
                })
                .map((device) => (
                <Card
                  key={device.id}
                  className="cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:bg-accent/20 transition-all duration-300 border-border bg-card animate-fade-in group"
                  onClick={() => openDeviceDetails(device)}
                >
                  <CardContent className="p-4">
                    {/* Account Usage Notice */}
                    {device.is_current && (
                      <div className="mb-3 space-y-2">
                        <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                          <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                            <Activity size={14} />
                            Your shqipet account is being used on this device
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFixDeviceType(device.id);
                          }}
                          disabled={fixingDeviceId === device.id}
                          className="w-full text-xs h-8"
                        >
                          {fixingDeviceId === device.id ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                              Updating device info...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1.5" />
                              Update device info
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className="p-2.5 bg-accent/50 rounded-xl transition-all duration-200"
                                title={`${getDeviceLabel(device.device_type)} Device`}
                              >
                                {getDeviceIcon(device.device_type, device.is_current)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>This session is from a {getDeviceLabel(device.device_type)} device.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="text-xs text-muted-foreground">
                          {getDeviceLabel(device.device_type)} — {device.operating_system || 'Unknown OS'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3 className="font-semibold text-foreground text-base">
                            {device.device_name || `${device.device_type} Device`}
                          </h3>
                          {device.platform_type && device.platform_type !== 'web' && (
                            <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium border border-blue-500/20 uppercase">
                              {device.platform_type}
                            </span>
                          )}
                          {device.is_current && (
                            <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium border border-primary/20">
                              Current
                            </span>
                          )}
                          {device.is_trusted && (
                            <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium border border-emerald-500/20 flex items-center gap-1">
                              <ShieldCheck size={10} />
                              Trusted
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {/* Show multiple browser badges or single browser */}
                          {device.all_browsers && device.all_browsers.length > 1 ? (
                            <>
                              <span className="text-xs text-muted-foreground font-medium">
                                {device.session_count} session{device.session_count !== 1 ? 's' : ''}:
                              </span>
                              {device.all_browsers.map((browser, idx) => (
                                <div key={idx} className="flex items-center gap-1 bg-accent/50 px-2 py-0.5 rounded-md">
                                  {getBrowserIcon(browser)}
                                  <span className="text-xs text-muted-foreground">{browser}</span>
                                </div>
                              ))}
                            </>
                          ) : (
                            <>
                              {getBrowserIcon(device.browser_info)}
                              <p className="text-sm text-muted-foreground">
                                {device.browser_info || 'Unknown Browser'}
                              </p>
                            </>
                          )}
                          <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            {device.operating_system || 'Unknown OS'}
                          </span>
                        </div>
                        
                        {/* IP Address Display */}
                        {device.ip_address && (
                          <div className="flex items-center gap-1.5 text-xs mb-2">
                            <Globe size={12} className="text-muted-foreground" />
                            <span className="text-muted-foreground">IP:</span>
                            <span className="font-mono font-medium text-foreground">{device.ip_address}</span>
                          </div>
                        )}
                        
                        {/* Date & Time - Full Format */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span className="font-medium">
                            Last: {new Date(device.last_seen).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span>
                            First: {new Date(device.first_seen).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <span>Logins: {device.login_count}</span>
                        </div>
                        
                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-xs">
                          {device.country_code && (
                            <span className="text-lg" title={device.country}>
                              {getFlagEmoji(device.country_code)}
                            </span>
                          )}
                          <MapPin size={12} className="text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {device.city && device.country 
                              ? `${device.city}, ${device.country}`
                              : device.location || 'Unknown location'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(device).split(' ')[0]} ${device.session_status === 'active' || device.is_current ? 'animate-pulse' : ''}`} />
                          <span className={`text-xs font-medium ${getStatusColor(device).split(' ')[1]}`}>
                            {getStatusText(device)}
                          </span>
                        </div>
                        {device.is_trusted && (
                          <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            ) : (
              <DeviceMapView 
                devices={trustedDevices.map(d => ({
                  id: d.id,
                  device_name: d.device_name,
                  device_type: d.device_type,
                  location: d.location,
                  latitude: d.latitude,
                  longitude: d.longitude,
                  is_current: d.is_current,
                  session_status: d.session_status,
                }))}
                onDeviceClick={(deviceId) => {
                  const device = trustedDevices.find(d => d.id === deviceId);
                  if (device) openDeviceDetails(device);
                }}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Monitor size={48} className="mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium mb-2 text-foreground">No devices found</p>
            <p className="text-sm mb-4">
              Your active devices will appear here once you log in
            </p>
            <Button onClick={refreshDevices} variant="outline" className="h-10">
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
          </div>
        )}
      </div>

      <SecurityTipsPanel />

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