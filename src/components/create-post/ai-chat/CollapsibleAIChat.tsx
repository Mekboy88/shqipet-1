import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatMessage from './ChatMessage';
import ChatTypingBar from './ChatTypingBar';
import TypingIndicator from './TypingIndicator';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface CollapsibleAIChatProps {
  onUseText?: (text: string) => void;
  hideToggleButton?: boolean;
  isExpanded?: boolean;
  onToggleChange?: (isExpanded: boolean) => void;
}

const CollapsibleAIChat: React.FC<CollapsibleAIChatProps> = ({ 
  onUseText, 
  hideToggleButton = false, 
  isExpanded: controlledIsExpanded,
  onToggleChange 
}) => {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : internalIsExpanded;
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m Shqipet AI, your creative assistant. I can help you improve your writing, generate captions, suggest hashtags, and more. How can I help you today?'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastTouchYRef = useRef<number | null>(null);
  const { toast } = useToast();

  const handleWheelCapture = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    e.stopPropagation();
    e.preventDefault();
    el.scrollTop += e.deltaY;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    lastTouchYRef.current = e.touches[0].clientY;
  };

  const handleTouchMoveCapture = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = messagesContainerRef.current;
    const lastY = lastTouchYRef.current;
    if (!el || lastY == null) return;
    const currentY = e.touches[0].clientY;
    const delta = lastY - currentY;
    e.stopPropagation();
    e.preventDefault();
    el.scrollTop += delta;
    lastTouchYRef.current = currentY;
  };

  const handleTouchEnd = () => { lastTouchYRef.current = null; };

  const toggleExpanded = (value: boolean) => {
    if (controlledIsExpanded === undefined) {
      setInternalIsExpanded(value);
    }
    onToggleChange?.(value);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(content)
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('improve') || lowerMessage.includes('better')) {
      return 'Here\'s an improved version of your text:\n\n"Experience the extraordinary journey through life\'s most meaningful moments. Share your story with authenticity and passion."\n\nThis version is more engaging and emotionally resonant.';
    } else if (lowerMessage.includes('hashtag')) {
      return 'Here are some trending hashtags for your post:\n\n#Inspiration #LifeGoals #Motivation #Success #DailyVibes #AuthenticLiving #ShareYourStory';
    } else if (lowerMessage.includes('caption') || lowerMessage.includes('generate')) {
      return 'Here\'s a creative caption for you:\n\n"Every moment is a story waiting to be told. Today, I\'m sharing mine. 🌟 What\'s yours?"';
    } else {
      return 'I\'m here to help! You can ask me to:\n\n• Improve your writing\n• Generate captions\n• Suggest hashtags\n• Check grammar\n• Translate text\n• Optimize engagement\n\nWhat would you like me to help you with?';
    }
  };

  const handleUseText = (text: string) => {
    if (onUseText) {
      onUseText(text);
      toast({
        title: 'Text Applied',
        description: 'The text has been added to your post.',
      });
    }
  };

  return (
    <>
      <style>{`
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .no-scrollbar::-webkit-scrollbar { width: 0; height: 0; display: none; }
        .scroll-isolated { overscroll-behavior: contain; touch-action: pan-y; }
        .scroll-lock { overscroll-behavior: none; }
        .scroll-capture { touch-action: none; }
      `}</style>
      {/* Toggle Button (visible when collapsed) */}
      {!hideToggleButton && (
        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="fixed right-4 top-24 z-50"
            >
              <Button
                onClick={() => toggleExpanded(true)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">💬 Shqipet AI</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Chat Sidebar */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.96, x: 40 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="fixed right-4 top-[72px] h-[calc(100vh-88px)] w-[400px] bg-white/70 backdrop-blur-xl shadow-lg border border-gray-200/60 z-50 flex flex-col rounded-3xl scroll-lock"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/60">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇦🇱</span>
                <div>
                  <h3 className="font-bold text-gray-800">Shqipet AI</h3>
                  <p className="text-xs text-gray-600">Creative Assistant</p>
                </div>
              </div>
              <Button
                onClick={() => toggleExpanded(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-600 hover:text-[#e60000] hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto no-scrollbar scroll-isolated scroll-lock scroll-capture p-6 space-y-4"
              onWheelCapture={handleWheelCapture}
              onTouchStart={handleTouchStart}
              onTouchMoveCapture={handleTouchMoveCapture}
              onTouchEnd={handleTouchEnd}
            >
              {messages.map(message => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  onUseText={message.role === 'assistant' ? handleUseText : undefined}
                />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing Bar */}
            <div className="p-6 border-t border-gray-200/60">
              <ChatTypingBar onSendMessage={handleSendMessage} disabled={isTyping} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CollapsibleAIChat;
