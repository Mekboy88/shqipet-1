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
        @keyframes smokeDrift {
          0% { transform: rotate(0deg); filter: blur(10px); opacity: 0.4; }
          50% { transform: rotate(180deg); filter: blur(12px); opacity: 0.5; }
          100% { transform: rotate(360deg); filter: blur(10px); opacity: 0.4; }
        }

        @keyframes smokeDriftReverse {
          0% { transform: rotate(360deg); filter: blur(11px); opacity: 0.35; }
          50% { transform: rotate(180deg); filter: blur(13px); opacity: 0.45; }
          100% { transform: rotate(0deg); filter: blur(11px); opacity: 0.35; }
        }

        .smoke-wrap {
          position: relative;
          border-radius: 1.25rem;
          overflow: visible;
        }

        .smoke-wrap::before,
        .smoke-wrap::after {
          content: "";
          position: absolute;
          inset: -8px;
          border-radius: inherit;
          pointer-events: none;
          z-index: -1;
          mix-blend-mode: lighten;
        }

        .smoke-wrap::before {
          background: conic-gradient(
            from 0deg,
            rgba(230,0,0,0.4),
            rgba(0,0,0,0.4),
            rgba(230,0,0,0.4),
            rgba(0,0,0,0.4)
          );
          animation: smokeDrift 24s linear infinite;
        }

        .smoke-wrap::after {
          background: conic-gradient(
            from 180deg,
            rgba(0,0,0,0.35),
            rgba(230,0,0,0.35),
            rgba(0,0,0,0.35),
            rgba(230,0,0,0.35)
          );
          animation: smokeDriftReverse 32s linear infinite;
        }

        .smoke-inner {
          position: relative;
          border: 1px solid rgba(0,0,0,0.15);
          border-radius: 1.25rem;
          background: white;
          z-index: 2;
        }
      `}</style>

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
              caretColor: "#e60000",
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
                className="h-8 w-8 p-0 text-[#666] hover:text-[#e60000] hover:scale-110 transition-all ease-in-out duration-200"
              >
                <Icon className="w-4 h-4" />
              </Button>
            ))}
            <Button
              type="submit"
              disabled={!message.trim() || disabled}
              size="sm"
              className="h-9 w-9 p-0 bg-[#e60000] hover:bg-[#000000] disabled:bg-gray-300 disabled:opacity-50 rounded-full hover:scale-110 transition-all ease-in-out duration-200"
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
