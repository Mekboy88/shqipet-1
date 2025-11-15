import { Circle, LogOut, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InteractiveMap } from './InteractiveMap';
import type { Database } from '@/integrations/supabase/types';
import { formatDistanceToNow, differenceInMinutes, differenceInHours, differenceInDays, format } from 'date-fns';
import { getCountryFlag } from '@/utils/countryFlags';
import { getDeviceIcon, deriveTitle, getDeviceLabel, getBrowserIcon } from '@/utils/deviceSessionDisplay';

type UserSession = Database['public']['Tables']['user_sessions']['Row'];

interface DeviceCardProps {
  session: UserSession;
  isCurrentDevice: boolean;
  onClick: () => void;
  onRevoke?: () => void;
}

export const DeviceCard = ({ session, isCurrentDevice, onClick, onRevoke }: DeviceCardProps) => {
  const DeviceIcon = getDeviceIcon(session.device_type);
  const BrowserIcon = getBrowserIcon(session.browser_name);
  const displayTitle = deriveTitle(session.browser_name, session.operating_system, session.device_type);
  const deviceLabel = getDeviceLabel(session.device_type);

  const getSessionStartTime = () => {
    if (!session.created_at) return 'Unknown';
    try {
      return format(new Date(session.created_at), 'MMM dd, hh:mm a');
    } catch (e) {
      return 'Unknown';
    }
  };

  const getSessionDuration = () => {
    if (!session.created_at) return 'Unknown';
    try {
      const now = new Date();
      const start = new Date(session.created_at);
      const days = differenceInDays(now, start);
      const hours = differenceInHours(now, start);
      const minutes = differenceInMinutes(now, start);

      if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } catch (e) {
      return 'Unknown';
    }
  };

  const getLastActiveTime = () => {
    if (!session.updated_at) return 'Unknown';
    try {
      return formatDistanceToNow(new Date(session.updated_at), { addSuffix: true });
    } catch (e) {
      return 'Unknown';
    }
  };

  const locationText = session.city && session.country 
    ? `${session.city}, ${session.country}`
    : session.country || 'Unknown location';

  const handleRevoke = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRevoke) onRevoke();
  };

  return (
    <Card className="w-full cursor-pointer hover:shadow-lg transition-shadow overflow-hidden" onClick={onClick}>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-stretch min-h-[220px]">
          <div className="flex-1 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DeviceIcon size={24} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold leading-tight">{displayTitle}</h3>
                    <Badge variant="outline" className="text-xs">{deviceLabel}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <BrowserIcon size={12} className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {session.browser_name || 'Unknown'} {session.browser_version || ''}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isCurrentDevice && (
                  <Badge className="bg-blue-500 text-white text-xs">Current</Badge>
                )}
                {session.is_trusted ? (
                  <Badge className="bg-green-600 text-white text-xs">Trusted</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Not Trusted</Badge>
                )}
                {!isCurrentDevice && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRevoke}
                    className="h-7 px-2"
                  >
                    <LogOut size={14} className="mr-1" />
                    <span className="text-xs">Log Out</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">
                  <Circle size={8} className="fill-green-500 text-green-500" />
                  <span>Active</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Session Started</p>
                <p className="text-xs">{getSessionStartTime()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground flex items-center gap-1">
                  <Clock size={12} />
                  Duration
                </p>
                <p>{getSessionDuration()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Last Active</p>
                <p className="text-xs">{getLastActiveTime()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Location {getCountryFlag(session.country_code)}</p>
                <p className="break-words text-xs">{locationText}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Device Category</p>
                <p className="capitalize">{deviceLabel}</p>
              </div>
            </div>
          </div>

          {session.latitude && session.longitude && (
            <div className="w-full md:w-[350px] h-[200px] md:h-auto">
              <InteractiveMap 
                latitude={session.latitude} 
                longitude={session.longitude}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
