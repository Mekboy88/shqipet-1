import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, AtSign, Zap, Link2 } from "lucide-react";

interface ChatTypingBarProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatTypingBar: React.FC<ChatTypingBarProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(24); // 1 line height
  
  const LINE_HEIGHT = 24; // pixels per line
  const MIN_LINES = 1;
  const MAX_LINES = 8; // grows to 8 lines before scrolling

  React.useEffect(() => {
    if (textareaRef.current) {
      // Reset height to measure scrollHeight accurately
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lines = Math.floor(scrollHeight / LINE_HEIGHT);
      
      // Calculate height: min 1 line, max 8 lines
      const clampedLines = Math.max(MIN_LINES, Math.min(lines, MAX_LINES));
      const newHeight = clampedLines * LINE_HEIGHT;
      
      setTextareaHeight(newHeight);
    }
  }, [message, isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <style>{`
        .smoke-wrap {
          position: relative;
          border-radius: 1.25rem;
          overflow: visible;
          z-index: 1;
        }

        /* Neon glow around border */
        .smoke-wrap::before {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 1.25rem;
          background: rgba(239, 68, 68, 0.3);
          filter: url(#smoke-turbulence) blur(12px);
          animation: smoke-color-shift 12s ease-in-out infinite alternate; animation-fill-mode: both;
          pointer-events: none;
          z-index: -1;
        }

        @keyframes smoke-color-shift {
          0% {
            background-color: rgba(239, 68, 68, 0.35);
          }
          100% {
            background-color: rgba(31, 41, 55, 0.1);
          }
        }

        /* Base typing box with very thin neon border */
        .smoke-inner {
          position: relative;
          border-radius: 1.25rem;
          background: white;
          border: 0.5px solid rgba(255, 255, 255, 0.3);
          z-index: 2;
        }

        /* Hide platform scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.4);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.6);
        }

        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(239, 68, 68, 0.4) transparent;
        }
      `}</style>
      {/* SVG filter for organic smoke turbulence */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="smoke-turbulence" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="2">
            <animate attributeName="baseFrequency" values="0.02;0.04;0.02" dur="10s" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="15">
            <animate attributeName="scale" values="10;20;10" dur="8s" repeatCount="indefinite" />
          </feDisplacementMap>
        </filter>
      </svg>

      <div className="smoke-wrap">
        <div className="smoke-inner px-4 py-3 space-y-2">
          {/* Textarea field */}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask anything..."
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            style={{
              lineHeight: `${LINE_HEIGHT}px`,
              fontSize: "1rem",
              caretColor: "hsl(var(--destructive))",
              height: `${textareaHeight}px`,
              maxHeight: `${MAX_LINES * LINE_HEIGHT}px`,
            }}
            className={`w-full min-h-0 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#888] text-[#111] px-0 py-0 text-base custom-scrollbar overflow-y-auto transition-[height] duration-200 ease-out`}
          />

          {/* Icons row */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {[AtSign, Zap, Link2, Mic].map((Icon, i) => (
              <Button
                key={i}
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:scale-110 transition-all ease-in-out duration-200"
              >
                <Icon className="w-4 h-4" />
              </Button>
            ))}
            <Button
              type="submit"
              disabled={!message.trim() || disabled}
              size="sm"
              className="h-9 w-9 p-0 bg-destructive hover:bg-primary disabled:bg-gray-300 disabled:opacity-50 rounded-full hover:scale-110 transition-all ease-in-out duration-200"
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
