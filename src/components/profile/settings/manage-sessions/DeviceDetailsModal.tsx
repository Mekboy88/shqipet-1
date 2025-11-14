import { Monitor, Smartphone, Tablet, MapPin, Globe, Clock, Shield, AlertTriangle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InteractiveMap } from './InteractiveMap';
import type { Database } from '@/integrations/supabase/types';
import { formatDistanceToNow, format } from 'date-fns';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[700px] max-h-[700px] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
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

        {/* Content - Fixed height, no scroll */}
        <div className="px-6 pb-6 h-[580px] flex flex-col gap-4">
          {/* Main Content Area */}
          <div className="flex gap-4 flex-1">
            {/* Left Column - Device Details */}
            <div className="flex-1 space-y-4 overflow-auto">
              {/* Device Information */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Monitor size={16} />
                  Device Information
                </h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">{session.device_type}</span>
                  </div>
                  {session.device_brand && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Brand:</span>
                      <span className="font-medium">{session.device_brand}</span>
                    </div>
                  )}
                  {session.device_model && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model:</span>
                      <span className="font-medium">{session.device_model}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* System & Browser */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Globe size={16} />
                  System & Browser
                </h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">OS:</span>
                    <span className="font-medium">
                      {session.operating_system} {session.device_os_version}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Browser:</span>
                    <span className="font-medium">
                      {session.browser_info} {session.browser_version}
                    </span>
                  </div>
                  {session.screen_resolution && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Screen:</span>
                      <span className="font-medium">{session.screen_resolution}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <MapPin size={16} />
                  Location
                </h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                  {session.city && session.country ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">City:</span>
                        <span className="font-medium">{session.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Country:</span>
                        <span className="font-medium">{session.country}</span>
                      </div>
                      {session.latitude && session.longitude && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Coordinates:</span>
                          <span className="font-medium text-xs">
                            {Number(session.latitude).toFixed(4)}°, {Number(session.longitude).toFixed(4)}°
                          </span>
                        </div>
                      )}
                    </>
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
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Trust Score:</span>
                    <span className={`font-bold ${getTrustScoreColor(session.trust_score || 50)}`}>
                      {session.trust_score || 50}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Active:</span>
                    <span className="font-medium">{getLastActiveText()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium text-xs">{formatDate(session.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Map */}
            <div className="flex-1 flex flex-col">
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                <MapPin size={16} />
                Device Location
              </h4>
              <div className="flex-1 rounded-lg overflow-hidden border">
                <InteractiveMap
                  latitude={session.latitude ? Number(session.latitude) : undefined}
                  longitude={session.longitude ? Number(session.longitude) : undefined}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 border-t pt-4">
            {!session.is_trusted && (
              <Button
                onClick={() => onTrustDevice(session.device_stable_id)}
                className="flex-1"
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
                className="flex-1"
                variant="destructive"
              >
                <AlertTriangle size={16} className="mr-2" />
                Revoke Session
              </Button>
            )}
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
