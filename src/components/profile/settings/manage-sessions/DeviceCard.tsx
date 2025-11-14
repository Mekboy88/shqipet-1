import { Monitor, Smartphone, Tablet, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StaticMiniMap } from './StaticMiniMap';
import type { Database } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';

type UserSession = Database['public']['Tables']['user_sessions']['Row'];

interface DeviceCardProps {
  session: UserSession;
  isCurrentDevice: boolean;
  onClick: () => void;
}

export const DeviceCard = ({ session, isCurrentDevice, onClick }: DeviceCardProps) => {
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
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLastActiveText = () => {
    if (!session.last_activity) return 'Unknown';
    try {
      return formatDistanceToNow(new Date(session.last_activity), { addSuffix: true });
    } catch (e) {
      return 'Unknown';
    }
  };

  return (
    <Card
      className="aspect-square cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden group"
      onClick={onClick}
    >
      <CardContent className="p-4 h-full flex flex-col">
        {/* Mini Map in top-right corner */}
        <div className="absolute top-2 right-2 w-[100px] h-[100px] rounded-lg overflow-hidden border-2 border-background shadow-lg z-10">
          <StaticMiniMap
            latitude={session.latitude ? Number(session.latitude) : undefined}
            longitude={session.longitude ? Number(session.longitude) : undefined}
            className="w-full h-full"
          />
        </div>

        {/* Device Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <DeviceIcon size={32} className="text-primary" />
          </div>
        </div>

        {/* Device Info */}
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-center truncate pr-24">
            {session.device_name || 'Unknown Device'}
          </h3>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p className="truncate">
              {session.operating_system} {session.device_os_version}
            </p>
            <p className="truncate">
              {session.browser_info} {session.browser_version}
            </p>
          </div>
        </div>

        {/* Status and Trust Score */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Circle
              size={8}
              className={`${session.is_active ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`}
            />
            <span className="text-xs text-muted-foreground">
              {session.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <Badge
            variant="secondary"
            className={`${getTrustScoreColor(session.trust_score || 50)} text-white text-xs`}
          >
            {session.trust_score || 50}%
          </Badge>
        </div>

        {/* Last Active */}
        <p className="text-xs text-muted-foreground text-center mt-2">
          {getLastActiveText()}
        </p>

        {/* Current Device Badge */}
        {isCurrentDevice && (
          <Badge className="absolute top-2 left-2 bg-blue-500 text-white">
            Current
          </Badge>
        )}

        {/* Trusted Badge */}
        {session.is_trusted && (
          <Badge className="absolute bottom-2 left-2 bg-green-600 text-white text-xs">
            Trusted
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
