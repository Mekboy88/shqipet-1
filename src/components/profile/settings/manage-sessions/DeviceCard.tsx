import { Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InteractiveMap } from './InteractiveMap';
import type { Database } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';
import { formatLocationWithFlag, getCountryFlag } from '@/utils/countryFlags';
import { getDeviceIcon, deriveTitle, getDeviceLabel } from '@/utils/deviceSessionDisplay';
type UserSession = Database['public']['Tables']['user_sessions']['Row'];

interface DeviceCardProps {
  session: UserSession;
  isCurrentDevice: boolean;
  onClick: () => void;
}

export const DeviceCard = ({ session, isCurrentDevice, onClick }: DeviceCardProps) => {
  const DeviceIcon = getDeviceIcon(session.device_type);
  const displayTitle = deriveTitle(session.device_name, session.device_type);
  const deviceLabel = getDeviceLabel(session.device_type);

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLoginTimeText = () => {
    if (!session.created_at) return 'Unknown';
    try {
      return formatDistanceToNow(new Date(session.created_at), { addSuffix: true });
    } catch (e) {
      return 'Unknown';
    }
  };

  const locationText = session.city && session.country 
    ? `${session.city}, ${session.country}`
    : session.country || 'Unknown location';

  return (
    <Card className="w-full cursor-pointer hover:shadow-lg transition-shadow overflow-hidden" onClick={onClick}>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-stretch min-h-[220px]">
          {/* Left: Details */}
          <div className="flex-1 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DeviceIcon size={24} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold leading-tight">{displayTitle}</h3>
                    <Badge variant="outline" className="text-xs">{deviceLabel}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(session.operating_system || 'OS')} {session.device_os_version || ''} • {(session.browser_info || 'Browser')} {session.browser_version || ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isCurrentDevice && (
                  <Badge className="bg-blue-500 text-white text-xs">Current</Badge>
                )}
                {session.is_trusted && (
                  <Badge className="bg-green-600 text-white text-xs">Trusted</Badge>
                )}
                <Badge variant="secondary" className={`${getTrustScoreColor(session.trust_score || 50)} text-white text-xs`}>
                  {session.trust_score || 50}%
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">
                  <Circle size={8} className={`${session.is_active ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
                  <span>{session.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Logged in</p>
                <p>{getLoginTimeText()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Location {getCountryFlag(session.country_code)}</p>
                <p className="break-words">{locationText}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Screen</p>
                <p>{session.screen_resolution || '—'}</p>
              </div>
            </div>
          </div>

          {/* Right: Map */}
          <div className="md:w-[40%] w-full md:min-h-[220px] border-t md:border-t-0 md:border-l">
            <InteractiveMap
              latitude={session.latitude ? Number(session.latitude) : undefined}
              longitude={session.longitude ? Number(session.longitude) : undefined}
              className="w-full h-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
