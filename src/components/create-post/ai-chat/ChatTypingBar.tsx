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
        @keyframes rotateSmoke {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotateSmokeReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .typing-box {
          position: relative;
          border-radius: 1.25rem;
          background: white;
          border: 1px solid rgba(0,0,0,0.1);
          overflow: visible;
          z-index: 1;
        }
        .typing-box::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: conic-gradient(
            from 0deg,
            rgba(230,0,0,0.35),
            rgba(0,0,0,0.35),
            rgba(230,0,0,0.35)
          );
          filter: blur(8px);
          opacity: 0.4;
          z-index: -1;
          animation: rotateSmoke 18s linear infinite;
        }
        .typing-box::after {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: conic-gradient(
            from 90deg,
            rgba(0,0,0,0.35),
            rgba(230,0,0,0.35),
            rgba(0,0,0,0.35)
          );
          filter: blur(8px);
          opacity: 0.3;
          z-index: -1;
          animation: rotateSmokeReverse 24s linear infinite;
        }
      `}</style>
      
      <div className="typing-box px-4 py-3 space-y-2">
        {/* Textarea field */}
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask anything..."
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          style={{
            lineHeight: '1.5rem',
            fontSize: '1rem',
            caretColor: '#e60000'
          }}
          className="w-full min-h-[60px] max-h-[220px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#888] text-[#111] px-0 py-0 leading-6 text-base overflow-y-auto"
        />

        {/* Icons row */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-[#666] hover:text-[#e60000] hover:scale-110 transition-all ease-in-out duration-200"
          >
            <AtSign className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-[#666] hover:text-[#e60000] hover:scale-110 transition-all ease-in-out duration-200"
          >
            <Zap className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-[#666] hover:text-[#e60000] hover:scale-110 transition-all ease-in-out duration-200"
          >
            <Link2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-[#666] hover:text-[#e60000] hover:scale-110 transition-all ease-in-out duration-200"
          >
            <Mic className="w-4 h-4" />
          </Button>
          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            size="sm"
            className="h-9 w-9 p-0 bg-[#e60000] hover:bg-[#000000] disabled:bg-gray-300 disabled:opacity-50 rounded-full hover:scale-110 transition-all ease-in-out duration-200"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ChatTypingBar;
