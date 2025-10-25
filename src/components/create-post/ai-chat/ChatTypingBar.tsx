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
        @keyframes borderShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-border {
          border: 2px solid transparent;
          border-radius: 1rem;
          background: 
            linear-gradient(white, white) padding-box,
            linear-gradient(120deg, #000000, #e60000, #000000) border-box;
          background-size: 400% 400%;
          animation: borderShift 6s ease infinite;
        }
      `}</style>
      
      <div className="animated-border">
        <div className="flex items-start gap-2 px-4 py-3 bg-white rounded-[14px]">
          {/* Left action buttons */}
          <div className="flex items-center gap-1 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-600 hover:text-[#e60000] transition-colors"
            >
              <AtSign className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-600 hover:text-[#e60000] transition-colors"
            >
              <Zap className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-600 hover:text-[#e60000] transition-colors"
            >
              <Link2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Textarea field */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask anything…"
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            className="flex-1 min-h-[40px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 text-gray-800 py-2"
          />

          {/* Right action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-600 hover:text-[#e60000] transition-colors"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              type="submit"
              disabled={!message.trim() || disabled}
              size="sm"
              className="h-8 w-8 p-0 bg-[#e60000] hover:bg-black disabled:bg-gray-300 rounded-full transition-colors"
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
