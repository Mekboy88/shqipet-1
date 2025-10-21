import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useUniversalUser } from '@/hooks/useUniversalUser';
import { ChatSettingsProvider } from '@/contexts/ChatSettingsContext';
import { ChatThemeProvider } from '@/contexts/ChatThemeContext';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import ConversationsList from './ConversationsList';
import ChatThemeWrapper from './ChatThemeWrapper';
import IndividualChatWindow from './IndividualChatWindow';
import { 
  X, 
  Minus, 
  Send, 
  Phone, 
  Video, 
  Mic, 
  MicOff,
  Settings,
  Smile,
  Paperclip,
  MoreVertical,
  Image,
  File,
  Camera,
  MapPin,
  Calendar,
  Users,
  Search,
  Archive,
  Volume2,
  VolumeX
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'contact';
  timestamp: Date;
  type: 'text' | 'voice' | 'video' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  audioDuration?: number;
}

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  isOnline: boolean;
  isPinned: boolean;
  isMuted: boolean;
  type: 'direct' | 'group';
}

interface SlidingChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  onMaximize: () => void;
}

const SlidingChatWindow: React.FC<SlidingChatWindowProps> = ({
  isOpen,
  onClose,
  onMinimize,
  isMinimized,
  onMaximize
}) => {
  const { user } = useAuth();
  const { displayName, avatarUrl } = useUniversalUser(user?.id);
  
  // View state - now manages multiple open chats
  const [openChats, setOpenChats] = useState<Conversation[]>([]);
  
  // Sample conversations data
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      name: 'John Doe',
      avatar: '/placeholder.svg',
      lastMessage: 'Hey, how are you doing?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      unreadCount: 2,
      isOnline: true,
      isPinned: true,
      isMuted: false,
      type: 'direct'
    },
    {
      id: '2',
      name: 'Sarah Wilson',
      lastMessage: 'Can we schedule a meeting tomorrow?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      unreadCount: 0,
      isOnline: false,
      isPinned: false,
      isMuted: false,
      type: 'direct'
    },
    {
      id: '3',
      name: 'Team Group',
      lastMessage: 'Great work on the project!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      unreadCount: 5,
      isOnline: true,
      isPinned: false,
      isMuted: true,
      type: 'group'
    }
  ]);
  
  // Archived conversations
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([
    {
      id: '4',
      name: 'Mike Johnson',
      lastMessage: 'Thanks for the help yesterday',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      unreadCount: 0,
      isOnline: true,
      isPinned: false,
      isMuted: false,
      type: 'direct'
    }
  ]);
  
  // Get user initials
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! How can I help you today?',
      sender: 'contact',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [inputExpanded, setInputExpanded] = useState(false);
  const [isVoiceCall, setIsVoiceCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Resize state
  const [windowHeight, setWindowHeight] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ y: 0, startHeight: 500 });
  const rafRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset window height to default when closed
  useEffect(() => {
    if (!isOpen) {
      setWindowHeight(500);
    }
  }, [isOpen]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: 'user',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([...messages, message]);
      setNewMessage('');
      
      // Smoothly reset textarea height and cursor position
      setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder="Type your message..."]') as HTMLTextAreaElement;
        if (textarea) {
          // Enable transition for smooth reset
          textarea.style.transition = 'height 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
          textarea.style.height = '40px';
          textarea.style.overflowY = 'hidden';
          textarea.focus();
          textarea.setSelectionRange(0, 0);
        }
      }, 0);

      // Simulate response
      setTimeout(() => {
        const response: Message = {
          id: (Date.now() + 1).toString(),
          text: "Thanks for your message! I'm here to help.",
          sender: 'contact',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, response]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      const message: Message = {
        id: Date.now().toString(),
        text: `Shared ${file.type.startsWith('image/') ? 'an image' : 'a file'}: ${file.name}`,
        sender: 'user',
        timestamp: new Date(),
        type: file.type.startsWith('image/') ? 'image' : 'file',
        fileUrl,
        fileName: file.name
      };
      setMessages([...messages, message]);
    }
  };

  const startRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      return;
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Calculate approximate duration (you could get actual duration with audio element)
        const duration = Math.floor(chunks.length / 2); // Rough estimate
        
        const message: Message = {
          id: Date.now().toString(),
          text: `🎤 Voice message (${duration}s)`,
          sender: 'user',
          timestamp: new Date(),
          type: 'voice',
          fileUrl: audioUrl,
          audioDuration: duration
        };
        
        setMessages(prev => [...prev, message]);
        setIsRecording(false);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        chunks.length = 0;
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks([]);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const emojis = ['😀', '😂', '😍', '🥺', '😎', '🤔', '👍', '❤️', '🔥', '💯', '🎉', '👏'];

  // Smooth resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    resizeStartRef.current = { y: clientY, startHeight: windowHeight };
  }, [windowHeight]);

  const handleResizeMove = useCallback((clientY: number) => {
    if (!isResizing) return;
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      const deltaY = resizeStartRef.current.y - clientY;
      const newHeight = Math.max(300, Math.min(800, resizeStartRef.current.startHeight + deltaY));
      setWindowHeight(newHeight);
    });
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => handleResizeMove(e.clientY);
    const handleTouchMove = (e: TouchEvent) => handleResizeMove(e.touches[0].clientY);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.addEventListener('touchend', handleResizeEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('touchend', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const clearChat = () => {
    setMessages([{
      id: '1',
      text: 'Chat cleared. How can I help you today?',
      sender: 'contact',
      timestamp: new Date(),
      type: 'text'
    }]);
  };

  // Handle conversation selection - open in new window
  const handleSelectConversation = (conversation: Conversation) => {
    // Check if this conversation is already open
    if (!openChats.find(c => c.id === conversation.id)) {
      setOpenChats(prev => [...prev, conversation]);
    }
  };

  // Handle close individual chat window
  const handleCloseChat = (conversationId: string) => {
    setOpenChats(prev => prev.filter(c => c.id !== conversationId));
  };

  // Handle start new chat
  const handleStartNewChat = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      name: 'New Chat',
      lastMessage: '',
      timestamp: new Date(),
      unreadCount: 0,
      isOnline: true,
      isPinned: false,
      isMuted: false,
      type: 'direct'
    };
    setOpenChats(prev => [...prev, newConversation]);
  };

  // Handle conversation actions
  const handlePinConversation = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, isPinned: !conv.isPinned }
        : conv
    ));
  };

  const handleMuteConversation = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, isMuted: !conv.isMuted }
        : conv
    ));
  };

  const handleArchiveConversation = (conversationId: string) => {
    const conversationToArchive = conversations.find(conv => conv.id === conversationId);
    if (conversationToArchive) {
      // Move to archived
      setArchivedConversations(prev => [...prev, conversationToArchive]);
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    }
  };

  const handleDeleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    // Also close the chat window if it's open
    handleCloseChat(conversationId);
  };

  // Minimized state - floating input at bottom
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-slide-in-right">
        <Card className="w-80 bg-primary/10 border border-primary/20 shadow-2xl shadow-primary/20">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-8 w-8 ring-2 ring-primary/30">
                <AvatarImage src={avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{getInitials(displayName || "User")}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-primary">
                {displayName || "User"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMaximize}
                className="ml-auto h-6 w-6 p-0 hover:bg-primary/20"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 border-primary/30 bg-background/50 focus:ring-2 focus:ring-primary/50 text-center placeholder:text-center caret-primary"
              />
              <Button 
                onClick={sendMessage} 
                size="sm"
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Full chat window
  if (!isOpen) return null;

  return createPortal(
    <ChatSettingsProvider>
      <ChatThemeProvider>
        <div className="fixed inset-0 z-50 pointer-events-none">
          <ChatThemeWrapper>
            {/* Main Conversations Window - Right Side */}
            <Card 
              className="fixed w-[380px] bg-background border border-border shadow-2xl animate-slide-in-right overflow-hidden pointer-events-auto flex flex-col rounded-xl transition-all duration-150" 
              style={{ 
                right: '20px', 
                bottom: '20px', 
                zIndex: 9999,
                height: `${windowHeight}px`,
                cursor: isResizing ? 'ns-resize' : 'default'
              }}
            >
              {/* Drag Handle */}
              <div 
                className="absolute top-0 left-0 right-0 h-4 flex items-center justify-center cursor-ns-resize hover:bg-primary/5 active:bg-primary/10 transition-colors z-20 group"
                onMouseDown={handleResizeStart}
                onTouchStart={handleResizeStart}
              >
                <div className="flex flex-col gap-0.5 items-center justify-center py-1">
                  <div className="w-8 h-0.5 rounded-full bg-muted-foreground/30 group-hover:bg-primary/50 group-active:bg-primary transition-colors" />
                  <div className="w-8 h-0.5 rounded-full bg-muted-foreground/30 group-hover:bg-primary/50 group-active:bg-primary transition-colors" />
                </div>
              </div>

              {/* Header */}
              <div className="absolute top-4 left-0 right-0 bg-primary/10 border-b border-border p-4 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-border">
                      <AvatarImage src={avatarUrl || "/placeholder.svg"} />
                      <AvatarFallback className="bg-muted text-foreground font-semibold">
                        {getInitials(displayName || "User")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {displayName || "Messages"}
                      </h3>
                      <p className="text-xs text-foreground/70">
                        {conversations.length} conversations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onMinimize}
                      className="h-8 w-8 p-0 hover:bg-secondary/20"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Conversations List */}
              <div className="absolute top-[92px] left-0 right-0 bottom-0 overflow-hidden">
                <ConversationsList
                  conversations={conversations}
                  archivedConversations={archivedConversations}
                  onSelectConversation={handleSelectConversation}
                  onStartNewChat={handleStartNewChat}
                  onPinConversation={handlePinConversation}
                  onMuteConversation={handleMuteConversation}
                  onArchiveConversation={handleArchiveConversation}
                  onDeleteConversation={handleDeleteConversation}
                />
              </div>
            </Card>

            {/* Individual Chat Windows - Left Side */}
            {openChats.map((chat, index) => (
              <IndividualChatWindow
                key={chat.id}
                conversation={chat}
                onClose={() => handleCloseChat(chat.id)}
                windowIndex={index}
              />
            ))}
          </ChatThemeWrapper>
        </div>
      </ChatThemeProvider>
    </ChatSettingsProvider>,
    document.body
  );
};

export default SlidingChatWindow;