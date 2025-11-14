import { Monitor, Smartphone, Tablet, Laptop, MapPin, Globe, Clock, Shield, AlertTriangle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InteractiveMap } from './InteractiveMap';
import type { Database } from '@/integrations/supabase/types';
import { formatDistanceToNow, format } from 'date-fns';
import { formatLocationWithFlag } from '@/utils/countryFlags';

type UserSession = Database['public']['Tables']['user_sessions']['Row'];

interface DeviceDetailsModalProps {
  session: UserSession | null;
  isCurrentDevice: boolean;
  isOpen: boolean;
  onClose: () => void;
  onTrustDevice: (deviceStableId: string) => void;
  onRevokeSession: (deviceStableId: string) => void;
}

export const DeviceDetailsModal = ({
  session,
  isCurrentDevice,
  isOpen,
  onClose,
  onTrustDevice,
  onRevokeSession,
}: DeviceDetailsModalProps) => {
  if (!session) return null;

  const getDeviceIcon = () => {
    switch (session.device_type) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      case 'laptop':
        return Laptop;
      default:
        return Monitor;
    }
  };

  const DeviceIcon = getDeviceIcon();

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getLastActiveText = () => {
    if (!session.last_activity) return 'Unknown';
    try {
      return formatDistanceToNow(new Date(session.last_activity), { addSuffix: true });
    } catch (e) {
      return 'Unknown';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Unknown';
    try {
      return format(new Date(date), 'PPp');
    } catch (e) {
      return 'Unknown';
    }
  };

  const locationText = formatLocationWithFlag(
    session.city,
    session.country,
    session.country_code
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] max-w-none h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DeviceIcon size={24} className="text-primary" />
              </div>
              <div>
                <DialogTitle>{session.device_name || 'Unknown Device'}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  {isCurrentDevice && (
                    <Badge className="bg-blue-500 text-white text-xs">Current Device</Badge>
                  )}
                  {session.is_trusted && (
                    <Badge className="bg-green-600 text-white text-xs">Trusted</Badge>
                  )}
                  <Badge variant={session.is_active ? 'default' : 'secondary'} className="text-xs">
                    {session.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        {/* Content - Two columns layout */}
        <div className="flex h-[calc(100%-140px)] overflow-hidden">
          {/* Left Column - Device Details (scrollable) */}
          <div className="flex-1 px-6 py-4 overflow-y-auto space-y-4">
            {/* Device Information */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Monitor size={16} />
                Device Information
              </h4>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground block mb-1">Type:</span>
                    <span className="font-medium capitalize">{session.device_type}</span>
                  </div>
                  {session.device_brand && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Brand:</span>
                      <span className="font-medium">{session.device_brand}</span>
                    </div>
                  )}
                  {session.device_model && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Model:</span>
                      <span className="font-medium">{session.device_model}</span>
                    </div>
                  )}
                  {session.device_full_name && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Full Name:</span>
                      <span className="font-medium">{session.device_full_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* System & Browser */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Globe size={16} />
                System & Browser
              </h4>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground block mb-1">Operating System:</span>
                    <span className="font-medium">
                      {session.operating_system} {session.device_os_version}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Browser:</span>
                    <span className="font-medium">
                      {session.browser_info} {session.browser_version}
                    </span>
                  </div>
                  {session.screen_resolution && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Screen Resolution:</span>
                      <span className="font-medium">{session.screen_resolution}</span>
                    </div>
                  )}
                  {session.platform_type && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Platform:</span>
                      <span className="font-medium capitalize">{session.platform_type}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <MapPin size={16} />
                Location
              </h4>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                {session.city && session.country ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-muted-foreground block mb-1">Full Location:</span>
                      <span className="font-medium">{locationText}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">City:</span>
                      <span className="font-medium">{session.city}</span>
                    </div>
                    {session.latitude && session.longitude && (
                      <div>
                        <span className="text-muted-foreground block mb-1">Coordinates:</span>
                        <span className="font-medium text-xs">
                          {Number(session.latitude).toFixed(4)}°, {Number(session.longitude).toFixed(4)}°
                        </span>
                      </div>
                    )}
                    {session.ip_address && (
                      <div>
                        <span className="text-muted-foreground block mb-1">IP Address:</span>
                        <span className="font-medium">{session.ip_address}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-2">No location data available</p>
                )}
              </div>
            </div>

            {/* Security */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Shield size={16} />
                Security
              </h4>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground block mb-1">Trust Score:</span>
                    <span className={`font-bold text-lg ${getTrustScoreColor(session.trust_score || 50)}`}>
                      {session.trust_score || 50}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Session Status:</span>
                    <span className="font-medium">{session.session_status || 'Active'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Last Active:</span>
                    <span className="font-medium">{getLastActiveText()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Created:</span>
                    <span className="font-medium text-xs">{formatDate(session.created_at)}</span>
                  </div>
                  {session.login_count && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Login Count:</span>
                      <span className="font-medium">{session.login_count}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {(session.user_agent || session.device_fingerprint) && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Clock size={16} />
                  Technical Details
                </h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                  {session.user_agent && (
                    <div>
                      <span className="text-muted-foreground block mb-1">User Agent:</span>
                      <span className="font-mono text-xs break-all">{session.user_agent}</span>
                    </div>
                  )}
                  {session.device_fingerprint && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Device Fingerprint:</span>
                      <span className="font-mono text-xs break-all">{session.device_fingerprint}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Map (full height) */}
          <div className="w-[45%] border-l flex flex-col">
            <div className="p-4 border-b">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <MapPin size={16} />
                Device Location
              </h4>
            </div>
            <div className="flex-1 overflow-hidden">
              <InteractiveMap
                latitude={session.latitude ? Number(session.latitude) : undefined}
                longitude={session.longitude ? Number(session.longitude) : undefined}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex gap-2 border-t p-4">
          {!session.is_trusted && (
            <Button
              onClick={() => onTrustDevice(session.device_stable_id)}
              variant="default"
            >
              <Shield size={16} className="mr-2" />
              Trust Device
            </Button>
          )}
          {!isCurrentDevice && (
            <Button
              onClick={() => {
                onRevokeSession(session.device_stable_id);
                onClose();
              }}
              variant="destructive"
            >
              <AlertTriangle size={16} className="mr-2" />
              Revoke Session
            </Button>
          )}
          <Button onClick={onClose} variant="outline" className="ml-auto">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
