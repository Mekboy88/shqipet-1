import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      {/* Animated smoke glow effect */}
      <div className="absolute inset-0 rounded-full opacity-40 blur-xl animate-pulse bg-gradient-to-r from-red-200/50 via-red-300/30 to-red-200/50" />
      
      <div className="relative flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-white/80 via-red-50/30 to-white/80 backdrop-blur-sm border border-red-200/40 rounded-full shadow-[0_4px_15px_rgba(239,68,68,0.08)]">
        {/* Left action buttons */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-red-50"
          >
            <AtSign className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-red-50"
          >
            <Zap className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-red-50"
          >
            <Link2 className="w-4 h-4 text-gray-600" />
          </Button>
        </div>

        {/* Input field */}
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask anything…"
          disabled={disabled}
          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400"
        />

        {/* Right action buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-red-50"
          >
            <Mic className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            size="sm"
            className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 rounded-full"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ChatTypingBar;
