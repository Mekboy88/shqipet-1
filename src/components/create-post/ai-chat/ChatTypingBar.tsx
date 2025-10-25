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
          0% {
            background-position: 0% 50%;
            filter: blur(0.4px);
          }
          25% {
            background-position: 50% 100%;
            filter: blur(0.8px);
          }
          50% {
            background-position: 100% 50%;
            filter: blur(0.4px);
          }
          75% {
            background-position: 50% 0%;
            filter: blur(0.7px);
          }
          100% {
            background-position: 0% 50%;
            filter: blur(0.4px);
          }
        }
        .smoke-border-flow {
          border: 1.5px solid transparent;
          border-radius: 1rem;
          background: 
            linear-gradient(white, white) padding-box,
            linear-gradient(120deg, rgba(255,255,255,0.1), #000000, #e60000, #000000, rgba(255,255,255,0.1)) border-box;
          background-size: 400% 400%;
          animation: smokeFlow 10s ease-in-out infinite;
          box-shadow: 0 0 20px rgba(230,0,0,0.04);
        }
      `}</style>
      
      <div className="smoke-border-flow">
        <div className="bg-white rounded-[0.9rem] p-4 space-y-2">
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
