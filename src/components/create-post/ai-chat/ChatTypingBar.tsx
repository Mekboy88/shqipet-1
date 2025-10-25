import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './ChatTypingBar.css';

interface ChatTypingBarProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

const ChatTypingBar: React.FC<ChatTypingBarProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="smoke-wrap">
      <div className="typing-box">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask Shqipet AI for suggestions..."
          className="flex-1 resize-none bg-transparent outline-none text-sm min-h-[40px] max-h-[120px]"
          rows={1}
          disabled={disabled}
        />
        <Button
          onClick={handleSend}
          size="icon"
          variant="ghost"
          className="shrink-0"
          disabled={!input.trim() || disabled}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatTypingBar;
