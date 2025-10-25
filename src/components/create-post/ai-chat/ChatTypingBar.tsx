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

        /* Spread out wispy smoke around the border */
        .smoke-wrap::before,
        .smoke-wrap::after {
          content: "";
          position: absolute;
          inset: -8px;
          border-radius: 1.25rem;
          background: conic-gradient(
            from var(--angle),
            transparent 0%,
            hsl(var(--destructive) / 0.2) 10%,
            hsl(var(--primary) / 0.25) 25%,
            transparent 35%,
            transparent 65%,
            hsl(var(--primary) / 0.2) 75%,
            hsl(var(--destructive) / 0.25) 90%,
            transparent 100%
          );
          -webkit-mask: 
            linear-gradient(#fff 0 0) content-box, 
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          padding: 2px;
          filter: blur(10px) url(#smoke-turbulence);
          animation: smoke-flow 8s linear infinite;
          pointer-events: none;
          z-index: -1;
        }

        .smoke-wrap::after {
          inset: -12px;
          animation: smoke-flow 10s linear infinite reverse;
          filter: blur(14px) url(#smoke-turbulence);
          opacity: 0.5;
        }

        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes smoke-flow {
          0% { --angle: 0deg; transform: rotate(0deg); }
          100% { --angle: 360deg; transform: rotate(360deg); }
        }

        /* Base typing box with subtle border */
        .smoke-inner {
          position: relative;
          border-radius: 1.25rem;
          background: white;
          border: 1px solid hsl(var(--border) / 0.3);
          z-index: 2;
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
