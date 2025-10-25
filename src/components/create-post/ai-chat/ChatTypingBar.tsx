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
        @keyframes smokeShift {
          0% { 
            background-position: 0% 50%; 
            filter: blur(0px); 
          }
          50% { 
            background-position: 100% 50%; 
            filter: blur(1px); 
          }
          100% { 
            background-position: 0% 50%; 
            filter: blur(0px); 
          }
        }
        .smoke-border {
          background: 
            linear-gradient(white, white) padding-box,
            radial-gradient(circle at 30% 30%, rgba(230, 0, 0, 0.4), transparent 60%),
            radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.4), transparent 60%),
            linear-gradient(120deg, #000000, #e60000, #000000) border-box;
          border: 2px solid transparent;
          border-radius: 1.5rem;
          background-size: 400% 400%;
          animation: smokeShift 8s ease-in-out infinite;
        }
      `}</style>
      
      <div className="smoke-border shadow-[0_0_20px_rgba(230,0,0,0.08)]">
        <div className="bg-white/90 backdrop-blur-md rounded-[1.4rem] p-4 space-y-2">
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
              lineHeight: '24px',
              caretColor: '#e60000'
            }}
            className="w-full min-h-[60px] max-h-40 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#777] text-[#111] px-0 py-0 leading-[24px]"
          />

          {/* Icons row */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-600 hover:text-[#e60000] hover:scale-110 transition-all duration-200"
            >
              <AtSign className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-600 hover:text-[#e60000] hover:scale-110 transition-all duration-200"
            >
              <Zap className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-600 hover:text-[#e60000] hover:scale-110 transition-all duration-200"
            >
              <Link2 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-600 hover:text-[#e60000] hover:scale-110 transition-all duration-200"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              type="submit"
              disabled={!message.trim() || disabled}
              size="sm"
              className="h-9 w-9 p-0 bg-[#e60000] hover:bg-black disabled:bg-gray-300 disabled:opacity-50 rounded-full hover:scale-110 transition-all duration-200"
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
