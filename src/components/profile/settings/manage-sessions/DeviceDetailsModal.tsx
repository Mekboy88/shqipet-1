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
      <DialogContent className="w-[96vw] max-w-none h-[88vh] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="p-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DeviceIcon size={20} className="text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base">{session.device_name || 'Unknown Device'}</DialogTitle>
                <div className="flex items-center gap-1.5 mt-0.5">
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
              <X size={18} />
            </Button>
          </div>
        </DialogHeader>

        {/* Content - Two columns layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column - Device Details */}
          <div className="flex-1 px-4 py-3 overflow-y-auto space-y-3">
            {/* Device Information */}
            <div className="space-y-1.5">
              <h4 className="font-semibold text-xs flex items-center gap-1.5">
                <Monitor size={14} />
                Device Information
              </h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Type:</span>
                    <span className="font-medium capitalize">{session.device_type}</span>
                  </div>
                  {session.device_brand && (
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Brand:</span>
                      <span className="font-medium">{session.device_brand}</span>
                    </div>
                  )}
                  {session.device_model && (
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Model:</span>
                      <span className="font-medium">{session.device_model}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* System & Browser */}
            <div className="space-y-1.5">
              <h4 className="font-semibold text-xs flex items-center gap-1.5">
                <Globe size={14} />
                System & Browser
              </h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Operating System:</span>
                    <span className="font-medium">
                      {session.operating_system} {session.device_os_version}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Browser:</span>
                    <span className="font-medium">
                      {session.browser_info} {session.browser_version}
                    </span>
                  </div>
                  {session.screen_resolution && (
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Screen:</span>
                      <span className="font-medium">{session.screen_resolution}</span>
                    </div>
                  )}
                  {session.platform_type && (
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Platform:</span>
                      <span className="font-medium capitalize">{session.platform_type}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <h4 className="font-semibold text-xs flex items-center gap-1.5">
                <MapPin size={14} />
                Location
              </h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-xs">
                {session.city && session.country ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Location:</span>
                      <span className="font-medium">{locationText}</span>
                    </div>
                    {session.latitude && session.longitude && (
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Coordinates:</span>
                        <span className="font-medium">
                          {Number(session.latitude).toFixed(4)}°, {Number(session.longitude).toFixed(4)}°
                        </span>
                      </div>
                    )}
                    {session.ip_address && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground block mb-0.5">IP Address:</span>
                        <span className="font-medium">{session.ip_address}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-1">No location data</p>
                )}
              </div>
            </div>

            {/* Security */}
            <div className="space-y-1.5">
              <h4 className="font-semibold text-xs flex items-center gap-1.5">
                <Shield size={14} />
                Security
              </h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Trust Score:</span>
                    <span className={`font-bold text-base ${getTrustScoreColor(session.trust_score || 50)}`}>
                      {session.trust_score || 50}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Status:</span>
                    <span className="font-medium">{session.session_status || 'Active'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Last Active:</span>
                    <span className="font-medium">{getLastActiveText()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Created:</span>
                    <span className="font-medium">{formatDate(session.created_at)}</span>
                  </div>
                  {session.login_count && (
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Logins:</span>
                      <span className="font-medium">{session.login_count}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Technical Details */}
            {(session.user_agent || session.device_fingerprint) && (
              <div className="space-y-1.5">
                <h4 className="font-semibold text-xs flex items-center gap-1.5">
                  <Clock size={14} />
                  Technical Details
                </h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-xs">
                  {session.user_agent && (
                    <div>
                      <span className="text-muted-foreground block mb-0.5">User Agent:</span>
                      <span className="font-mono text-[10px] break-all">{session.user_agent}</span>
                    </div>
                  )}
                  {session.device_fingerprint && (
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Device Fingerprint:</span>
                      <span className="font-mono text-[10px] break-all">{session.device_fingerprint}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Map */}
          <div className="w-[42%] border-l flex flex-col">
            <div className="p-3 border-b">
              <h4 className="font-semibold text-xs flex items-center gap-1.5">
                <MapPin size={14} />
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

        {/* Action Buttons */}
        <div className="flex gap-2 border-t p-3">
          {!session.is_trusted && (
            <Button
              onClick={() => onTrustDevice(session.device_stable_id)}
              variant="default"
              size="sm"
            >
              <Shield size={14} className="mr-1.5" />
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
              size="sm"
            >
              <AlertTriangle size={14} className="mr-1.5" />
              Revoke Session
            </Button>
          )}
          <Button onClick={onClose} variant="outline" size="sm" className="ml-auto">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
