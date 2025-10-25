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
        @keyframes smokeDrift {
          0% { transform: rotate(0deg) scale(1); filter: blur(9px); }
          50% { transform: rotate(180deg) scale(1.02); filter: blur(11px); }
          100% { transform: rotate(360deg) scale(1); filter: blur(9px); }
        }
        @keyframes smokeDriftReverse {
          0% { transform: rotate(360deg) scale(1); filter: blur(10px); }
          50% { transform: rotate(180deg) scale(1.03); filter: blur(12px); }
          100% { transform: rotate(0deg) scale(1); filter: blur(10px); }
        }
        .smoke-wrap {
          position: relative;
          border-radius: 1.25rem;
          overflow: visible;
        }
        .smoke-wrap::before,
        .smoke-wrap::after {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          pointer-events: none;
          background: conic-gradient(
            from 0deg,
            rgba(230,0,0,0.3) 0deg,
            rgba(0,0,0,0.3) 120deg,
            rgba(230,0,0,0.3) 240deg,
            rgba(0,0,0,0.3) 360deg
          );
          mix-blend-mode: lighten;
          filter: blur(10px);
          opacity: 0.3;
          z-index: -1;
          animation: smokeDrift 22s linear infinite;
        }
        .smoke-wrap::after {
          animation: smokeDriftReverse 28s linear infinite;
          opacity: 0.25;
        }
      `}</style>
      
      <div className="smoke-wrap">
        <div className="border border-gray-300 rounded-[1.25rem] bg-white px-4 py-3 space-y-2">
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
      </div>
    </form>
  );
};

export default ChatTypingBar;
