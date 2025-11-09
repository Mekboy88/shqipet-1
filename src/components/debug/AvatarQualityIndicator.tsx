import React, { useEffect, useState, useRef } from 'react';
import { Info, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

interface AvatarQualityIndicatorProps {
  avatarRef: React.RefObject<HTMLElement>;
  sourceSize: { width: number; height: number } | null;
  sizeKey: string;
  availableSizes: Record<string, string> | null;
  className?: string;
}

type QualityStatus = 'optimal' | 'acceptable' | 'scaled-down' | 'scaled-up' | 'unknown';

const AvatarQualityIndicator: React.FC<AvatarQualityIndicatorProps> = ({
  avatarRef,
  sourceSize,
  sizeKey,
  availableSizes,
  className
}) => {
  const [renderedSize, setRenderedSize] = useState<{ width: number; height: number } | null>(null);
  const [status, setStatus] = useState<QualityStatus>('unknown');
  const [showDetails, setShowDetails] = useState(false);

  // Measure actual rendered size
  useEffect(() => {
    const measureSize = () => {
      if (!avatarRef.current) return;
      
      const rect = avatarRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      setRenderedSize({
        width: Math.round(rect.width * dpr),
        height: Math.round(rect.height * dpr)
      });
    };

    measureSize();
    
    // Remeasure on resize
    const resizeObserver = new ResizeObserver(measureSize);
    if (avatarRef.current) {
      resizeObserver.observe(avatarRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [avatarRef]);

  // Calculate quality status
  useEffect(() => {
    if (!renderedSize || !sourceSize) {
      setStatus('unknown');
      return;
    }

    const renderedPixels = renderedSize.width * renderedSize.height;
    const sourcePixels = sourceSize.width * sourceSize.height;
    const ratio = sourcePixels / renderedPixels;

    if (ratio >= 0.9 && ratio <= 1.5) {
      // Nearly 1:1 - optimal
      setStatus('optimal');
    } else if (ratio >= 0.5 && ratio <= 2.5) {
      // Acceptable range - some scaling but not terrible
      setStatus('acceptable');
    } else if (ratio < 0.5) {
      // Source is smaller than rendered - scaled up (blurry)
      setStatus('scaled-up');
    } else {
      // Source is much larger than rendered - wasting bandwidth
      setStatus('scaled-down');
    }
  }, [renderedSize, sourceSize]);

  const getStatusConfig = () => {
    switch (status) {
      case 'optimal':
        return {
          icon: CheckCircle,
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Optimal',
          message: 'Perfect size match!'
        };
      case 'acceptable':
        return {
          icon: Info,
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Good',
          message: 'Minor scaling, acceptable quality'
        };
      case 'scaled-up':
        return {
          icon: AlertTriangle,
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Scaled Up',
          message: 'Image smaller than display - may appear blurry'
        };
      case 'scaled-down':
        return {
          icon: AlertCircle,
          color: 'bg-orange-500',
          textColor: 'text-orange-700',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          label: 'Over-sized',
          message: 'Image much larger than needed - wasting bandwidth'
        };
      default:
        return {
          icon: Info,
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Loading',
          message: 'Calculating...'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const getRecommendedSize = (): string => {
    if (!renderedSize) return 'unknown';
    
    const maxDimension = Math.max(renderedSize.width, renderedSize.height);
    
    if (maxDimension <= 80) return 'thumbnail (64px)';
    if (maxDimension <= 150) return 'small (128px)';
    if (maxDimension <= 300) return 'medium (256px)';
    return 'large (512px)';
  };

  const getBestAvailableSize = (): string | null => {
    if (!availableSizes || !renderedSize) return null;
    
    const maxDimension = Math.max(renderedSize.width, renderedSize.height);
    
    // Find closest size without going below rendered size
    if (maxDimension <= 80 && availableSizes.thumbnail) return 'thumbnail';
    if (maxDimension <= 150 && availableSizes.small) return 'small';
    if (maxDimension <= 300 && availableSizes.medium) return 'medium';
    if (availableSizes.large) return 'large';
    
    return 'original';
  };

  const recommendedSize = getRecommendedSize();
  const bestSize = getBestAvailableSize();
  const isUsingOptimal = sizeKey === bestSize;

  return (
    <div 
      className={`absolute -top-2 -right-2 z-50 ${className || ''}`}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      {/* Status Badge */}
      <div className={`${config.color} rounded-full p-1 shadow-lg cursor-pointer`}>
        <Icon className="w-4 h-4 text-white" />
      </div>

      {/* Details Popup */}
      {showDetails && (
        <div className={`absolute top-8 right-0 w-72 ${config.bgColor} ${config.borderColor} border-2 rounded-lg shadow-xl p-3 ${config.textColor}`}>
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-5 h-5" />
            <span className="font-bold">{config.label}</span>
          </div>
          
          <p className="text-sm mb-3">{config.message}</p>
          
          <div className="space-y-1 text-xs border-t pt-2 border-current/20">
            <div className="flex justify-between">
              <span className="opacity-70">Rendered:</span>
              <span className="font-mono">
                {renderedSize ? `${renderedSize.width}×${renderedSize.height}px` : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Source:</span>
              <span className="font-mono">
                {sourceSize ? `${sourceSize.width}×${sourceSize.height}px` : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Using:</span>
              <span className="font-mono font-semibold">{sizeKey}</span>
            </div>
            {!isUsingOptimal && bestSize && (
              <div className="flex justify-between text-orange-600 mt-2 pt-2 border-t border-current/20">
                <span className="opacity-70">Recommended:</span>
                <span className="font-mono font-semibold">{bestSize}</span>
              </div>
            )}
            {renderedSize && sourceSize && (
              <div className="flex justify-between">
                <span className="opacity-70">Scale Ratio:</span>
                <span className="font-mono">
                  {((sourceSize.width * sourceSize.height) / (renderedSize.width * renderedSize.height)).toFixed(2)}x
                </span>
              </div>
            )}
          </div>

          {availableSizes && (
            <div className="mt-2 pt-2 border-t border-current/20">
              <div className="text-xs opacity-70 mb-1">Available sizes:</div>
              <div className="flex flex-wrap gap-1">
                {Object.keys(availableSizes).map(key => (
                  <span 
                    key={key}
                    className={`text-xs px-2 py-0.5 rounded ${
                      key === sizeKey 
                        ? 'bg-current/20 font-semibold' 
                        : 'bg-current/10'
                    }`}
                  >
                    {key}
                  </span>
                ))}
              </div>
            </div>
          )}

          {status === 'scaled-up' && (
            <div className="mt-2 pt-2 border-t border-red-200">
              <p className="text-xs">
                💡 <strong>Tip:</strong> Use the "{recommendedSize}" variant for better quality.
              </p>
            </div>
          )}

          {status === 'scaled-down' && (
            <div className="mt-2 pt-2 border-t border-orange-200">
              <p className="text-xs">
                💡 <strong>Tip:</strong> Use "{recommendedSize}" to save {
                  sourceSize && renderedSize 
                    ? `${Math.round((1 - (renderedSize.width * renderedSize.height) / (sourceSize.width * sourceSize.height)) * 100)}%`
                    : 'bandwidth'
                }.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvatarQualityIndicator;
