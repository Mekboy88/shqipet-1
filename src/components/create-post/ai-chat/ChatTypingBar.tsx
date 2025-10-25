import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, AtSign, Zap, Link2 } from 'lucide-react';

interface ChatTypingBarProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatTypingBar: React.FC<ChatTypingBarProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <style>{`
        @keyframes smokeRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .smoke-container {
          position: relative;
          border-radius: 1.25rem;
          background: white;
          border: 1px solid rgba(0,0,0,0.08);
          overflow: hidden;
          z-index: 1;
        }

        .smoke-container::before,
        .smoke-container::after {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          pointer-events: none;
          background: conic-gradient(
            from 0deg,
            rgba(255,0,0,0.25) 0deg,
            rgba(0,0,0,0.25) 120deg,
            rgba(255,0,0,0.25) 240deg,
            rgba(0,0,0,0.25) 360deg
          );
          filter: blur(12px);
          opacity: 0.35;
          z-index: -1;
          animation: smokeRotate 24s linear infinite;
        }

        .smoke-container::after {
          background: conic-gradient(
            from 180deg,
            rgba(0,0,0,0.25) 0deg,
            rgba(255,0,0,0.25) 120deg,
            rgba(0,0,0,0.25) 240deg,
            rgba(255,0,0,0.25) 360deg
          );
          animation-duration: 32s;
          animation-direction: reverse;
          mix-blend-mode: lighten;
        }
      `}</style>

      <div className="smoke-container p-3">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="min-h-[60px] w-full resize-none border-none focus-visible:ring-0 text-black bg-transparent"
          disabled={disabled}
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex space-x-2">
            <Button type="button" size="icon" variant="ghost"><Mic size={18} /></Button>
            <Button type="button" size="icon" variant="ghost"><AtSign size={18} /></Button>
            <Button type="button" size="icon" variant="ghost"><Link2 size={18} /></Button>
            <Button type="button" size="icon" variant="ghost"><Zap size={18} /></Button>
          </div>
          <Button type="submit" size="icon" variant="default" disabled={disabled}>
            <Send size={18} />
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ChatTypingBar;
```

✅ **Fix summary:**
- Removed conflicting gradient definitions and nested selectors.
- Added two **independent conic gradients** (`::before` & `::after`) rotating in opposite directions for the real **floating smoke motion**.
- Adjusted opacity and blur for **light, smooth aura**.
- Border remains thin and elegant while the “smoke” drifts naturally around edges.