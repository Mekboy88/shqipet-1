
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface CookieConsentBannerProps {
  onAccept: () => void;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onAccept }) => {
  const navigate = useNavigate();

  const handleLearnMore = () => {
    navigate('/auth/cookies-consent');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <p className="text-sm leading-relaxed">
            This website uses cookies to ensure you get the best experience on our website.{' '}
            <button
              onClick={handleLearnMore}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Learn More
            </button>
          </p>
        </div>
        
        <Button
          onClick={onAccept}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm font-medium rounded flex-shrink-0"
        >
          Got It!
        </Button>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
