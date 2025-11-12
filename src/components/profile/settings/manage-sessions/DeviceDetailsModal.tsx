import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet, Laptop, Clock, MapPin, Globe, Shield, ShieldCheck, Copy, LogOut, Chrome, Activity, AlertCircle, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatTimeAgo } from '@/lib/utils/timeUtils';

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
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-sm font-medium text-foreground">Active</p>
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
                  <MapPin size={14} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{device.location || 'Unknown location'}</span>
                </div>
                {device.location && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => copyToClipboard(device.location!, 'Location')}
                  >
                    <Copy size={12} />
                  </Button>
                )}
              </div>
              {device.ip_address && (
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-muted-foreground" />
                    <span className="text-sm font-mono text-foreground">{device.ip_address}</span>
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
            </div>
          </div>

          {/* Device Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Shield size={16} className="text-primary" />
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
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1.5">Device Fingerprint</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-muted-foreground break-all flex-1">
                      {device.device_fingerprint}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 shrink-0"
                      onClick={() => copyToClipboard(device.device_fingerprint, 'Device Fingerprint')}
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Unique identifier to recognize this device across sessions
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
              {!device.is_trusted && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Consider marking this device as trusted if you recognize it to enable additional security features.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-border">
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
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDetailsModal;
