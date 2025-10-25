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
          isolation: isolate;
        }

        /* Glow layers */
        .smoke-wrap::before,
        .smoke-wrap::after {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 1.25rem;
          filter: url(#smoke-turbulence) blur(14px);
          pointer-events: none;
          z-index: 0;
          will-change: opacity, box-shadow, filter;
        }

        /* Red phase (red-500/10) */
        .smoke-wrap::before {
          background-color: rgba(239, 68, 68, 0.35);
          animation: glow-red 10s steps(1, end) infinite;
        }

        /* Gray phase (gray-800/10) */
        .smoke-wrap::after {
          background-color: rgba(31, 41, 55, 0.35);
          animation: glow-gray 10s steps(1, end) infinite;
        }

        /* Hard swap at 50% + neon glow on active layer */
        @keyframes glow-red {
          0%, 49.9% {
            opacity: 1;
            box-shadow: 0 0 32px 10px rgba(239, 68, 68, 0.8);
          }
          50%, 100% {
            opacity: 0;
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
        @keyframes glow-gray {
          0%, 49.9% {
            opacity: 0;
            box-shadow: 0 0 0 0 rgba(31, 41, 55, 0);
          }
          50%, 100% {
            opacity: 1;
            box-shadow: 0 0 32px 10px rgba(31, 41, 55, 0.8);
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
