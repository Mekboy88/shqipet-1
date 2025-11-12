import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet, Laptop, Clock, MapPin, Globe, Shield, ShieldCheck, Copy, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface DeviceDetails {
  id: string;
  device_name: string;
  device_type: 'desktop' | 'laptop' | 'tablet' | 'smartphone' | 'unknown';
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
    const iconProps = { size: 48, className: 'text-blue-600' };
    switch (device.device_type) {
      case 'smartphone': return <Smartphone {...iconProps} />;
      case 'tablet': return <Tablet {...iconProps} />;
      case 'laptop': return <Laptop {...iconProps} />;
      case 'desktop': return <Monitor {...iconProps} />;
      default: return <Monitor {...iconProps} />;
    }
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              {getDeviceIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                {device.device_name}
                {device.is_current && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                    Current Device
                  </span>
                )}
                {device.is_trusted && !device.is_current && (
                  <ShieldCheck size={16} className="text-green-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 font-normal mt-1">
                {device.browser_info} on {device.operating_system}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Complete details about this device session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Session Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <Clock size={16} />
              Session Information
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">First Seen</p>
                <p className="text-sm font-medium">{formatDate(device.first_seen)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Last Activity</p>
                <p className="text-sm font-medium">{formatDate(device.last_seen)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Login Count</p>
                <p className="text-sm font-medium">{device.login_count} times</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Trust Status</p>
                <p className="text-sm font-medium">
                  {device.is_trusted ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <ShieldCheck size={14} /> Trusted
                    </span>
                  ) : (
                    <span className="text-gray-600 flex items-center gap-1">
                      <Shield size={14} /> Not Trusted
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Location & Network */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <MapPin size={16} />
              Location & Network
            </h4>
            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-gray-500" />
                  <span className="text-sm">{device.location || 'Unknown location'}</span>
                </div>
                {device.location && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(device.location!, 'Location')}
                  >
                    <Copy size={12} />
                  </Button>
                )}
              </div>
              {device.ip_address && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-gray-500" />
                    <span className="text-sm font-mono">{device.ip_address}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(device.ip_address!, 'IP Address')}
                  >
                    <Copy size={12} />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Device Fingerprint */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <Shield size={16} />
              Device Fingerprint
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <code className="text-xs font-mono text-gray-700 break-all">
                  {device.device_fingerprint}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(device.device_fingerprint, 'Device Fingerprint')}
                >
                  <Copy size={12} />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This unique identifier helps recognize this device across sessions
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {!device.is_current && (
              <Button
                variant="outline"
                className="flex-1"
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
              className="flex-1"
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
