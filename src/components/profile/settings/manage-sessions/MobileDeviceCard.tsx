import { useState, useRef, TouchEvent } from 'react';
import { Monitor, Smartphone, Tablet, Laptop, Circle, Shield, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StaticMiniMap } from './StaticMiniMap';
import type { Database } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';
import { formatLocationWithFlag } from '@/utils/countryFlags';

type UserSession = Database['public']['Tables']['user_sessions']['Row'];

interface MobileDeviceCardProps {
  session: UserSession;
  isCurrentDevice: boolean;
  onClick: () => void;
  onTrust: () => void;
  onRevoke: () => void;
}

export const MobileDeviceCard = ({
  session,
  isCurrentDevice,
  onClick,
  onTrust,
  onRevoke,
}: MobileDeviceCardProps) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const deriveDisplayDeviceType = (s: UserSession): 'mobile' | 'tablet' | 'laptop' | 'desktop' => {
    const base = (s.device_type || '').toLowerCase();
    if (base === 'mobile' || base === 'tablet' || base === 'laptop') return base as any;
    const nameBlob = `${s.device_full_name || ''} ${s.device_name || ''} ${s.user_agent || ''}`.toLowerCase();
    if (/macbook|thinkpad|latitude|elitebook|pavilion|inspiron|aspire|zenbook|vivobook|swift|spectre|surface laptop/.test(nameBlob)) {
      return 'laptop';
    }
    const res = s.screen_resolution || '';
    const m = res.match(/(\d+)\s*x\s*(\d+)/i);
    if (m) {
      const w = parseInt(m[1], 10);
      const h = parseInt(m[2], 10);
      const ar = w / h;
      if (w >= 1200 && w <= 3200 && h >= 700 && h <= 2000 && ar >= 1.5 && ar <= 1.9) {
        return 'laptop';
      }
    }
    return base === 'desktop' || base === '' ? 'desktop' : (base as any);
  };

  const getDeviceIcon = () => {
    switch (deriveDisplayDeviceType(session)) {
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
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const makeDisplayName = (s: UserSession) => {
    const type = deriveDisplayDeviceType(s);
    const browser = s.browser_info ? `${s.browser_info}` : 'Browser';
    const bver = s.browser_version ? ` ${s.browser_version}` : '';
    const os = s.operating_system ? `${s.operating_system}` : 'OS';
    const over = s.device_os_version ? ` ${s.device_os_version}` : '';
    const typeCap = type.charAt(0).toUpperCase() + type.slice(1);
    return `${browser}${bver} ${os}${over} ${typeCap}`.trim();
  };

  const getLoginTimeText = () => {
    if (!session.created_at) return 'Unknown';
    try {
      return formatDistanceToNow(new Date(session.created_at), { addSuffix: true });
    } catch (e) {
      return 'Unknown';
    }
  };

  const locationText = formatLocationWithFlag(
    session.city,
    session.country,
    session.country_code
  );

  const handleTouchStart = (e: TouchEvent) => {
    if (isCurrentDevice) return; // No swipe for current device
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping || isCurrentDevice) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    
    // Only allow left swipe (negative values)
    if (diff < 0 && diff > -150) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    // If swiped more than 50px, show actions
    if (swipeOffset < -50) {
      setSwipeOffset(-140); // Lock at action position
    } else {
      setSwipeOffset(0); // Reset
    }
  };

  const handleActionClick = (action: () => void) => {
    action();
    setSwipeOffset(0); // Reset swipe after action
  };

  return (
    <div className="relative overflow-hidden">
      <Card
        ref={cardRef}
        className="relative transition-transform duration-200 cursor-pointer"
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
        onClick={() => {
          if (swipeOffset === 0) {
            onClick();
          } else {
            setSwipeOffset(0);
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Device Icon */}
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <DeviceIcon size={24} className="text-primary" />
            </div>

            {/* Device Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">
                  {makeDisplayName(session)}
                </h3>
                {isCurrentDevice && (
                  <Badge className="bg-blue-500 text-white text-xs">Current</Badge>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="truncate">
                  {session.operating_system} {session.device_os_version}
                </p>
                <p className="truncate">
                  {session.browser_info} {session.browser_version}
                </p>
                <p className="truncate">{locationText}</p>
                <p className="truncate">{getLoginTimeText()}</p>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Circle
                  size={8}
                  className={`${session.is_active ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`}
                />
                <span className="text-xs text-muted-foreground">
                  {session.is_active ? 'Active' : 'Inactive'}
                </span>
                <Badge
                  variant="secondary"
                  className={`${getTrustScoreColor(session.trust_score || 50)} text-white text-xs ml-auto`}
                >
                  {session.trust_score || 50}%
                </Badge>
              </div>
            </div>

            {/* Mini Map */}
            <div className="w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0">
              <StaticMiniMap
                latitude={session.latitude ? Number(session.latitude) : undefined}
                longitude={session.longitude ? Number(session.longitude) : undefined}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Trusted Badge */}
          {session.is_trusted && (
            <Badge className="bg-green-600 text-white text-xs mt-2">
              Trusted Device
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Swipe Actions (behind the card) */}
      {!isCurrentDevice && (
        <div className="absolute inset-y-0 right-0 flex items-stretch">
          {!session.is_trusted && (
            <button
              onClick={() => handleActionClick(onTrust)}
              className="bg-green-600 text-white px-6 flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <Shield size={20} />
            </button>
          )}
          <button
            onClick={() => handleActionClick(onRevoke)}
            className="bg-red-600 text-white px-6 flex items-center justify-center hover:bg-red-700 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
