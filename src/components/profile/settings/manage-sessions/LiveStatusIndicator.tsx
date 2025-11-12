import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LiveStatusIndicatorProps {
  isConnected: boolean;
}

const LiveStatusIndicator: React.FC<LiveStatusIndicatorProps> = ({ isConnected }) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setPulse(p => !p);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm">
            <div className="relative">
              <div 
                className={`w-2 h-2 rounded-full transition-colors ${
                  isConnected ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              {isConnected && (
                <div 
                  className={`absolute inset-0 w-2 h-2 rounded-full bg-green-400 ${
                    pulse ? 'animate-ping' : ''
                  }`}
                />
              )}
            </div>
            <span className="text-xs font-medium text-gray-700">
              {isConnected ? 'Real-time sync active' : 'Reconnecting...'}
            </span>
            <Activity size={12} className={isConnected ? 'text-green-600' : 'text-gray-400'} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {isConnected 
              ? 'Your devices are being updated live — any login/logout will appear instantly.' 
              : 'Connection lost. Attempting to reconnect...'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LiveStatusIndicator;
