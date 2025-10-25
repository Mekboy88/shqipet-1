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

        /* Pink neon smoky layer */
        .smoke-wrap::before {
          content: "";
          position: absolute;
          inset: -6px;
          border-radius: 1.25rem;
          background: #ff005e;
          -webkit-mask: 
            linear-gradient(#fff 0 0) content-box, 
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          padding: 3px;
          filter: url(#smoke-turbulence) blur(14px) drop-shadow(0 0 10px #ff005e) drop-shadow(0 0 20px #ff005e) drop-shadow(0 0 40px #ff005e);
          animation: neon-fade-out 1.6s ease-in-out infinite alternate;
          pointer-events: none;
          z-index: -1;
        }

        /* Cyan neon smoky layer */
        .smoke-wrap::after {
          content: "";
          position: absolute;
          inset: -6px;
          border-radius: 1.25rem;
          background: #00d4ff;
          -webkit-mask: 
            linear-gradient(#fff 0 0) content-box, 
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          padding: 3px;
          filter: url(#smoke-turbulence) blur(16px) drop-shadow(0 0 12px #00d4ff) drop-shadow(0 0 24px #00d4ff) drop-shadow(0 0 48px #00d4ff);
          animation: neon-fade-in 1.6s ease-in-out infinite alternate;
          pointer-events: none;
          z-index: -1;
        }

        @keyframes neon-fade-out {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes neon-fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        /* Base typing box with thin neon border line */
        .smoke-inner {
          position: relative;
          border-radius: 1.25rem;
          background: white;
          border: 0.5px solid transparent;
          z-index: 2;
        }
        .smoke-inner::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 0.5px;
          background: #ff005e;
          -webkit-mask: 
            linear-gradient(#fff 0 0) content-box, 
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          filter: blur(0.4px);
          opacity: 0.6;
          animation: neon-fade-out 1.6s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .smoke-inner::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 0.5px;
          background: #00d4ff;
          -webkit-mask: 
            linear-gradient(#fff 0 0) content-box, 
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          filter: blur(0.4px);
          opacity: 0.6;
          animation: neon-fade-in 1.6s ease-in-out infinite alternate;
          pointer-events: none;
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
