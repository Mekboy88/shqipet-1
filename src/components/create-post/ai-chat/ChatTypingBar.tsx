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

        /* Outer animated smoke layer using SVG turbulence */
        .smoke-wrap::before,
        .smoke-wrap::after {
          content: "";
          position: absolute;
          inset: -12px;
          border-radius: inherit;
          z-index: -1;
          filter: url(#smoke-filter);
          opacity: 0.7;
          mix-blend-mode: lighten;
        }

        .smoke-wrap::before {
          background: radial-gradient(circle, rgba(239, 68, 68, 0.1), rgba(31, 41, 55, 0.1));
          animation: smokeFlow 30s linear infinite;
        }

        .smoke-wrap::after {
          background: radial-gradient(circle, rgba(31, 41, 55, 0.1), rgba(239, 68, 68, 0.1));
          animation: smokeFlowReverse 40s linear infinite;
        }

        @keyframes smokeFlow {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes smokeFlowReverse {
          0% { transform: rotate(360deg); }
          50% { transform: rotate(180deg); }
          100% { transform: rotate(0deg); }
        }

        /* Base typing box */
        .smoke-inner {
          position: relative;
          border: 1px solid rgb(254, 202, 202);
          border-radius: 1.25rem;
          background: white;
          z-index: 2;
        }
      `}</style>

      {/* SVG Filter for real smoke motion */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="smoke-filter">
          <feTurbulence id="turb" baseFrequency="0.012 0.022" numOctaves="3" seed="8">
            <animate
              attributeName="baseFrequency"
              dur="30s"
              values="0.012 0.022; 0.018 0.028; 0.012 0.022"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="20" />
        </filter>
      </svg>

      <div className="smoke-wrap">
        <div className="smoke-inner px-4 py-3 space-y-2">
          {/* Textarea field */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask anything..."
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            style={{
              lineHeight: "1.5rem",
              fontSize: "1rem",
              caretColor: "hsl(var(--destructive))",
            }}
            className="w-full min-h-[60px] max-h-[220px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#888] text-[#111] px-0 py-0 leading-6 text-base overflow-y-auto"
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
