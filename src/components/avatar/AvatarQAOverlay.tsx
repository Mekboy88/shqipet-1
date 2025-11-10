/**
 * AvatarQAOverlay - Dev-only overlay for avatar quality testing
 * Shows when ?avatarQA=1 is in URL
 */

import React from 'react';
import { mediaService } from '@/services/media/MediaService';
import { toast } from 'sonner';

export const AvatarQAOverlay: React.FC = () => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const isDev = import.meta.env.DEV;
    const hasParam = new URLSearchParams(window.location.search).get('avatarQA') === '1';
    setShow(isDev && hasParam);
  }, []);

  const handleClearCache = () => {
    mediaService.clearAllCaches();
    toast.success('Avatar cache cleared. Refresh to reload images.');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2 pointer-events-auto">
      <button
        onClick={handleClearCache}
        className="bg-black/80 hover:bg-black text-white px-3 py-2 rounded-lg text-xs font-mono shadow-lg transition-colors"
        title="Clear all avatar caches and reload"
      >
        🗑️ Clear Avatar Cache
      </button>
      <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-[10px] font-mono">
        <div className="text-green-400 font-bold">🔍 Avatar QA Mode</div>
        <div className="mt-1 opacity-75">Check badges on avatars</div>
      </div>
    </div>
  );
};
