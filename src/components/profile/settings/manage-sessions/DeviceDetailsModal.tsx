import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet, Laptop, Clock, MapPin, Globe, Shield, ShieldCheck, Copy, LogOut, Chrome, Activity, AlertCircle, HelpCircle, Cpu, MonitorPlay, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { formatTimeAgo } from '@/lib/utils/timeUtils';
import MiniMapView from './MiniMapView';

interface DeviceDetails {
  id: string;
  device_name: string;
  device_type: 'desktop' | 'laptop' | 'tablet' | 'smartphone' | 'mobile' | 'unknown';
  browser_info: string;
  operating_system: string;
  device_fingerprint: string;
  first_seen: string;
  last_seen: string;
  is_current: boolean;
  is_trusted: boolean;
  login_count: number;
  location?: string;
  ip_address?: string;
  screen_resolution?: string;
  network_provider?: string;
  city?: string;
  country?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  platform_type?: 'web' | 'ios' | 'android' | 'pwa';
  app_version?: string;
  hardware_info?: any;
  mfa_enabled?: boolean;
  security_alerts?: any[];
  session_status?: 'active' | 'logged_in' | 'inactive';
}

interface DeviceDetailsModalProps {
  device: DeviceDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onLogout: (deviceId: string) => void;
  onToggleTrust: (deviceId: string, trusted: boolean) => void;
}

const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  device,
  isOpen,
  onClose,
  onLogout,
  onToggleTrust,
}) => {
  if (!device) return null;

  const getDeviceIcon = () => {
    const iconProps = { size: 40, className: device.is_current ? 'text-primary' : 'text-muted-foreground' };
    switch (device.device_type.toLowerCase()) {
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

  const getBrowserIcon = () => {
    const browser = device.browser_info.toLowerCase();
    const iconProps = { size: 20, className: 'text-muted-foreground' };
    if (browser.includes('chrome')) return <Chrome {...iconProps} />;
    if (browser.includes('safari')) return <Globe {...iconProps} />;
    if (browser.includes('firefox')) return <Activity {...iconProps} />;
    if (browser.includes('edge')) return <Globe {...iconProps} />;
    return <Globe {...iconProps} />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const copyAllDetails = () => {
    const details = `
Device: ${device.device_name}
Type: ${device.device_type}
Browser: ${device.browser_info}
OS: ${device.operating_system}
Screen: ${device.screen_resolution || 'Unknown'}
Platform: ${device.platform_type || 'web'}
Location: ${device.city || 'Unknown'}, ${device.country || 'Unknown'}
IP: ${device.ip_address || 'Unknown'}
Fingerprint: ${device.device_fingerprint}
First Seen: ${formatDate(device.first_seen)}
Last Active: ${formatDate(device.last_seen)}
Trusted: ${device.is_trusted ? 'Yes' : 'No'}
    `.trim();
    copyToClipboard(details, 'Session details');
  };

  const getStatusColor = () => {
    switch (device.session_status) {
      case 'active':
        return 'bg-green-500';
      case 'logged_in':
        return 'bg-amber-500';
      case 'inactive':
        return 'bg-gray-400';
      default:
        return 'bg-green-500';
    }
  };

  const getStatusText = () => {
    switch (device.session_status) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[480px] max-h-[85vh] overflow-y-auto rounded-xl border-border bg-card">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="flex items-start gap-4">
            <div className="p-3 bg-accent/50 rounded-xl">
              {getDeviceIcon()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-semibold text-foreground">{device.device_name}</span>
                {device.is_current && (
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium border border-primary/20">
                    Current Device
                  </span>
                )}
                {device.is_trusted && (
                  <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-medium border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck size={12} />
                    Trusted
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {getBrowserIcon()}
                <span className="text-sm text-muted-foreground">
                  {device.browser_info}
                </span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                  {device.operating_system}
                </span>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Complete security and session information for this device
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-6">
          {/* Session Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              Session Information
            </h4>
            <div className="grid grid-cols-2 gap-3 bg-accent/30 rounded-lg p-4 border border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">First Seen</p>
                <p className="text-sm font-medium text-foreground">{formatDate(device.first_seen)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(device.first_seen)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Last Activity</p>
                <p className="text-sm font-medium text-foreground">{formatDate(device.last_seen)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(device.last_seen)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Login Count</p>
                <p className="text-sm font-medium text-foreground">{device.login_count} sessions</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${device.session_status === 'active' ? 'animate-pulse' : ''}`} />
                  <p className="text-sm font-medium text-foreground">{getStatusText()}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Platform</p>
                <div className="flex items-center gap-1.5">
                  <MonitorPlay size={14} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground capitalize">{device.platform_type || 'Web'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Network */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              Location & Network
            </h4>
            <div className="space-y-3 bg-accent/30 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {device.country_code && (
                    <Flag size={14} className="text-muted-foreground" />
                  )}
                  <span className="text-sm text-foreground">
                    {device.city || 'Unknown'}, {device.country || 'Unknown'}
                  </span>
                </div>
                {device.location && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => copyToClipboard(`${device.city}, ${device.country}`, 'Location')}
                  >
                    <Copy size={12} />
                  </Button>
                )}
              </div>
              {device.ip_address && (
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">IP:</span>
                    <span className="text-sm font-mono font-semibold text-foreground">{device.ip_address}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => copyToClipboard(device.ip_address!, 'IP Address')}
                  >
                    <Copy size={12} />
                  </Button>
                </div>
              )}
              {device.network_provider && (
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Globe size={14} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Network: {device.network_provider}</span>
                </div>
              )}
              {(device.latitude && device.longitude) && (
                <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                  <p>Coordinates: {device.latitude.toFixed(4)}, {device.longitude.toFixed(4)}</p>
                  <p className="mt-1 italic">Location estimated from IP address</p>
                </div>
              )}
            </div>

            {/* Embedded Map */}
            {device.latitude && device.longitude && (
              <div className="mt-3">
                <MiniMapView
                  latitude={device.latitude}
                  longitude={device.longitude}
                  deviceName={device.device_name}
                  deviceType={device.device_type}
                  city={device.city}
                  country={device.country}
                  height="200px"
                />
              </div>
            )}
          </div>

          {/* Device Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Cpu size={16} className="text-primary" />
              Device Details
            </h4>
            <div className="bg-accent/30 rounded-lg p-4 border border-border">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Browser</p>
                  <div className="flex items-center gap-2">
                    {getBrowserIcon()}
                    <p className="text-sm font-medium text-foreground">{device.browser_info}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1.5">Operating System</p>
                  <p className="text-sm font-medium text-foreground">{device.operating_system}</p>
                </div>
                {device.screen_resolution && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1.5">Screen Resolution</p>
                    <p className="text-sm font-medium text-foreground">{device.screen_resolution}</p>
                  </div>
                )}
                {device.app_version && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1.5">App Version</p>
                    <p className="text-sm font-medium text-foreground">{device.app_version}</p>
                  </div>
                )}
                {device.hardware_info && Object.keys(device.hardware_info).length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1.5">Hardware</p>
                    <div className="text-xs space-y-1">
                      {device.hardware_info.cpu && (
                        <p className="text-foreground">CPU Cores: {device.hardware_info.cpu}</p>
                      )}
                      {device.hardware_info.memory && (
                        <p className="text-foreground">Memory: {device.hardware_info.memory} GB</p>
                      )}
                      {device.hardware_info.platform && (
                        <p className="text-foreground">Platform: {device.hardware_info.platform}</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1.5">Device ID (Fingerprint)</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-muted-foreground break-all flex-1">
                      {device.device_fingerprint}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 shrink-0"
                      onClick={() => copyToClipboard(device.device_fingerprint, 'Device ID')}
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Unique identifier used for security tracking
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary" />
              Security Information
            </h4>
            <div className="bg-accent/30 rounded-lg p-4 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Trust Status</span>
                </div>
                {device.is_trusted ? (
                  <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-medium border border-emerald-500/20">
                    Trusted
                  </span>
                ) : (
                  <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium border border-border">
                    Not Trusted
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">MFA Enabled</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  device.mfa_enabled 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-muted text-muted-foreground border border-border'
                }`}>
                  {device.mfa_enabled ? 'Yes' : 'No'}
                </span>
              </div>
              {device.security_alerts && device.security_alerts.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Security Alerts</p>
                  <div className="space-y-2">
                    {device.security_alerts.map((alert: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-red-500/10 rounded border border-red-500/20">
                        <AlertCircle size={14} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-red-700 dark:text-red-300">{alert.message || alert}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!device.is_trusted && (
                <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <AlertCircle size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Consider marking this device as trusted if you recognize it. Trusted devices skip MFA during login.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-6 border-t border-border">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={copyAllDetails}
              >
                <Copy size={14} className="mr-2" />
                Copy Session Details
              </Button>
            </div>
            <div className="flex gap-3">
              {!device.is_current && (
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => onToggleTrust(device.id, !device.is_trusted)}
                >
                  {device.is_trusted ? (
                    <>
                      <Shield size={16} className="mr-2" />
                      Remove Trust
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} className="mr-2" />
                      Mark as Trusted
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="destructive"
                className="flex-1 h-11"
                onClick={() => {
                  onLogout(device.id);
                  onClose();
                }}
              >
                <LogOut size={16} className="mr-2" />
                {device.is_current ? 'Logout' : 'Remove Device'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDetailsModal;
