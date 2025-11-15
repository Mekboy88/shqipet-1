import { Monitor, Smartphone, Tablet, Laptop, MapPin, Clock, Shield, X } from 'lucide-react';
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

  const getLoggedInText = () => {
    if (!session.created_at) return 'Unknown';
    try {
      return formatDistanceToNow(new Date(session.created_at), { addSuffix: true });
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

  const deviceTitle = `${session.browser_name || 'Unknown Browser'} on ${session.operating_system || 'Unknown OS'}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] max-w-none h-[88vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DeviceIcon size={20} className="text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base">{deviceTitle}</DialogTitle>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isCurrentDevice && (
                    <Badge className="bg-blue-500 text-white text-xs">Current Device</Badge>
                  )}
                  {session.is_trusted && (
                    <Badge className="bg-green-600 text-white text-xs">Trusted</Badge>
                  )}
                  <Badge variant="default" className="text-xs">Active</Badge>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={18} />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 px-4 py-3 overflow-y-auto space-y-3">
            <div className="space-y-1.5">
              <h4 className="font-semibold text-xs flex items-center gap-1.5">
                <Monitor size={14} />
                Device Information
              </h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Device Type:</span>
                  <span>{session.device_type || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Operating System:</span>
                  <span>{session.operating_system || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Browser:</span>
                  <span>{session.browser_name || 'Unknown'} {session.browser_version || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform:</span>
                  <span>{session.platform || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Screen Resolution:</span>
                  <span>{session.screen_resolution || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {(session.city || session.country) && (
              <div className="space-y-1.5">
                <h4 className="font-semibold text-xs flex items-center gap-1.5">
                  <MapPin size={14} />
                  Location Information
                </h4>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{locationText}</span>
                  </div>
                  {session.region && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Region:</span>
                      <span>{session.region}</span>
                    </div>
                  )}
                  {session.latitude && session.longitude && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coordinates:</span>
                      <span className="text-xs font-mono">
                        {session.latitude.toFixed(4)}, {session.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <h4 className="font-semibold text-xs flex items-center gap-1.5">
                <Clock size={14} />
                Session Information
              </h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First Login:</span>
                  <span>{formatDate(session.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Activity:</span>
                  <span>{formatDate(session.updated_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Since Login:</span>
                  <span>{getLoggedInText()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-semibold text-xs flex items-center gap-1.5">
                <Shield size={14} />
                Security Information
              </h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trusted Device:</span>
                  <span>{session.is_trusted ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Device:</span>
                  <span>{isCurrentDevice ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Session ID:</span>
                  <span className="text-xs font-mono truncate max-w-[150px]">
                    {session.session_id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {session.latitude && session.longitude && (
            <div className="w-[400px] border-l">
              <InteractiveMap 
                latitude={session.latitude} 
                longitude={session.longitude}
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t flex gap-2 justify-end">
          {!session.is_trusted && !isCurrentDevice && (
            <Button onClick={() => onTrustDevice(session.device_stable_id)} variant="default">
              <Shield size={16} className="mr-2" />
              Trust Device
            </Button>
          )}
          {!isCurrentDevice && (
            <Button onClick={() => onRevokeSession(session.device_stable_id)} variant="destructive">
              Revoke Session
            </Button>
          )}
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
