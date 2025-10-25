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

        /* Thin animated gradient ring around edges */
        .smoke-wrap::before {
          content: "";
          position: absolute;
          inset: 0;
          padding: 2px; /* ring thickness */
          border-radius: inherit;
          z-index: -1;
          background: conic-gradient(
            from 0deg,
            hsl(var(--destructive) / 0.7) 0%,
            hsl(var(--primary) / 0.7) 50%,
            hsl(var(--destructive) / 0.7) 100%
          ) border-box;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: ring-spin 10s linear infinite;
          opacity: 1;
        }

        .smoke-wrap::after {
          content: "";
          position: absolute;
          inset: 0;
          padding: 2px; /* subtle second layer */
          border-radius: inherit;
          z-index: -1;
          background: conic-gradient(
            from 180deg,
            hsl(var(--primary) / 0.5) 0%,
            hsl(var(--destructive) / 0.5) 50%,
            hsl(var(--primary) / 0.5) 100%
          ) border-box;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: ring-spin 14s linear infinite reverse;
          opacity: 1;
        }

        @keyframes ring-spin {
          to { transform: rotate(360deg); }
        }

        /* Base typing box */
        .smoke-inner {
          position: relative;
          border: 1px solid transparent;
          border-radius: 1.25rem;
          background: transparent;
          z-index: 2;
        }
      `}</style>

      <div className="smoke-wrap">
        <div className="smoke-inner flex-1 p-4 space-y-2 bg-gradient-to-r from-[hsl(var(--destructive)/0.1)] to-[hsl(var(--primary)/0.1)] border border-[hsl(var(--destructive)/0.2)] rounded-xl">
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
