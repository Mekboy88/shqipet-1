import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface DebugLog {
  t: number;
  msg: string;
}

declare global {
  interface Window {
    __FAILSAFE_DEBUG__?: DebugLog[];
  }
}

export const FailsafeDebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.__FAILSAFE_DEBUG__) {
        setLogs([...window.__FAILSAFE_DEBUG__]);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-black/80 text-white text-xs px-2 py-1 rounded z-[999998] hover:bg-black/90"
        title="Show Failsafe Debug (Ctrl+Shift+D)"
      >
        Debug
      </button>
    );
  }

  const startTime = logs[0]?.t || Date.now();

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white text-xs rounded shadow-lg z-[999998] max-w-sm">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/20">
        <span className="font-semibold">Failsafe Debug</span>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/10 rounded p-1"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto p-3 space-y-1">
        {logs.length === 0 ? (
          <div className="text-white/60">No debug logs yet</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="font-mono">
              <span className="text-green-400">+{log.t - startTime}ms</span>
              {' → '}
              <span className="text-blue-300">{log.msg}</span>
            </div>
          ))
        )}
      </div>
      <div className="px-3 py-2 border-t border-white/20 text-white/60">
        Press Ctrl+Shift+D to toggle
      </div>
    </div>
  );
};
