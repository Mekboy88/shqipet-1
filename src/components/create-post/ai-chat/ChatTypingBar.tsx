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
        @keyframes smokeFlow {
          0% { background-position: 0% 50%; }
          25% { background-position: 50% 100%; }
          50% { background-position: 100% 50%; }
          75% { background-position: 50% 0%; }
          100% { background-position: 0% 50%; }
        }
        .typing-container {
          position: relative;
          border: 1px solid transparent;
          border-radius: 1.25rem;
          background:
            linear-gradient(white, white) padding-box,
            linear-gradient(120deg, rgba(0,0,0,0.2), rgba(230,0,0,0.35), rgba(0,0,0,0.25), rgba(230,0,0,0.3)) border-box;
          background-size: 400% 400%;
          animation: smokeFlow 12s ease-in-out infinite;
          box-shadow: 0 0 25px rgba(230,0,0,0.05);
          z-index: 1;
        }
        .smoke-aura {
          position: absolute;
          inset: -8px;
          border-radius: 1.5rem;
          pointer-events: none;
          background:
            radial-gradient(40% 60% at 30% 30%, rgba(230,0,0,0.25), transparent 70%),
            radial-gradient(50% 70% at 70% 70%, rgba(0,0,0,0.25), transparent 70%),
            linear-gradient(120deg, #000000, #e60000, #000000);
          background-size: 400% 400%;
          animation: smokeFlow 12s ease-in-out infinite;
          opacity: 0.35;
          filter: blur(8px);
          z-index: 0;
        }
      `}</style>
      
      <div className="relative">
        <div className="smoke-aura" aria-hidden="true" />
        <div className="typing-container">
          <div className="bg-white rounded-[1.15rem] px-4 py-3 space-y-2">
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
      </div>
    </form>
  );
};

export default ChatTypingBar;
