import React, { useState, useRef, useEffect } from 'react';
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
  const { displayName } = useUniversalUser(user?.id);
  
  // View state
  const [currentView, setCurrentView] = useState<'conversations' | 'chat'>('conversations');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const clearChat = () => {
    setMessages([{
      id: '1',
      text: 'Chat cleared. How can I help you today?',
      sender: 'contact',
      timestamp: new Date(),
      type: 'text'
    }]);
  };

  // Handle conversation selection
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setCurrentView('chat');
    // Clear unread count when opening chat
    setMessages([{
      id: '1',
      text: `Hello! This is your conversation with ${conversation.name}`,
      sender: 'contact',
      timestamp: new Date(),
      type: 'text'
    }]);
  };

  // Handle back to conversations
  const handleBackToConversations = () => {
    setCurrentView('conversations');
    setSelectedConversation(null);
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
    setSelectedConversation(newConversation);
    setCurrentView('chat');
    setMessages([]);
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
    // If we're currently viewing this conversation, go back to conversations list
    if (selectedConversation?.id === conversationId) {
      handleBackToConversations();
    }
  };

  // Minimized state - floating input at bottom
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-slide-in-right">
        <Card className="w-80 bg-primary/10 border border-primary/20 shadow-2xl shadow-primary/20">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-8 w-8 ring-2 ring-primary/30">
                <AvatarImage src="/placeholder.svg" />
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
                className="flex-1 border-primary/30 bg-background/50 focus:ring-2 focus:ring-primary/50"
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

  return (
    <ChatSettingsProvider>
      <ChatThemeProvider>
        <ChatThemeWrapper className="fixed inset-0 z-50 pointer-events-none">
        {/* Chat Window */}
        <Card className="fixed w-[380px] h-[500px] bg-background border border-border shadow-2xl animate-slide-in-right overflow-hidden pointer-events-auto flex flex-col rounded-xl" style={{ right: '20px', bottom: '20px' }}>
        {/* Header - Fixed at top */}
        <div className="absolute top-0 left-0 right-0 bg-primary/10 border-b border-border p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentView === 'chat' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToConversations}
                  className="h-8 w-8 p-0 hover:bg-primary/20"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M19 12H6m0 0l4-4m-4 4l4 4"/>
                  </svg>
                </Button>
              )}
              <Avatar className="h-10 w-10 ring-2 ring-border">
                <AvatarImage src={selectedConversation?.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-muted text-foreground font-semibold">
                  {getInitials(currentView === 'conversations' ? (displayName || "User") : (selectedConversation?.name || "User"))}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground">
                  {currentView === 'conversations' ? (displayName || "Messages") : (selectedConversation?.name || "User")}
                </h3>
                <p className="text-xs text-foreground/70">
                  {currentView === 'conversations' ? `${conversations.length} conversations` : 'Online now'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {currentView === 'chat' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsVideoCall(!isVideoCall)}
                    className={`h-8 w-8 p-0 hover:bg-primary/20 ${isVideoCall ? 'bg-primary/20 text-primary' : ''}`}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsVoiceCall(!isVoiceCall)}
                    className={`h-8 w-8 p-0 hover:bg-primary/20 ${isVoiceCall ? 'bg-primary/20 text-primary' : ''}`}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </>
              )}
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

        {/* Call Status */}
        {(isVoiceCall || isVideoCall) && (
          <div className="bg-green-500/10 border-b border-green-500/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isVideoCall ? <Video className="h-4 w-4 text-green-500" /> : <Phone className="h-4 w-4 text-green-500" />}
                <span className="text-sm text-green-600 dark:text-green-400">
                  {isVideoCall ? 'Video Call Active' : 'Voice Call Active'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`h-8 w-8 p-0 ${isMuted ? 'bg-red-500/20 text-red-500' : 'hover:bg-green-500/20'}`}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsVoiceCall(false);
                    setIsVideoCall(false);
                  }}
                  className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-500"
                >
                  <Phone className="h-4 w-4 rotate-135" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        {currentView === 'conversations' ? (
          <div className="absolute top-[88px] left-0 right-0 bottom-0 overflow-hidden">
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
        ) : (
          <>
            {/* Messages - Fixed between header and input */}
            <div className="absolute top-[88px] left-0 right-0 bottom-[120px] overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`p-3 rounded-2xl shadow-lg break-words overflow-wrap-anywhere whitespace-pre-wrap ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground ml-2 rounded-br-md shadow-primary/30'
                            : 'bg-muted/50 border border-border/50 mr-2 rounded-bl-md'
                        }`}
                      >
                        {message.type === 'voice' && message.fileUrl && (
                          <div className="mb-2">
                            <VoiceMessagePlayer 
                              audioUrl={message.fileUrl} 
                              duration={message.audioDuration}
                            />
                          </div>
                        )}
                        {message.type === 'image' && message.fileUrl && (
                          <div className="mb-2">
                            <img 
                              src={message.fileUrl} 
                              alt={message.fileName} 
                              className="max-w-full h-auto rounded-lg border"
                            />
                          </div>
                        )}
                        {message.type === 'file' && message.fileUrl && (
                          <div className="mb-2 p-2 bg-muted/50 rounded border flex items-center gap-2">
                            <File className="h-4 w-4" />
                            <span className="text-sm">{message.fileName}</span>
                          </div>
                        )}
                        {message.type === 'text' && (
                          <p className="text-sm leading-relaxed">{message.text}</p>
                        )}
                        <p className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    {message.sender === 'contact' && (
                      <Avatar className="h-8 w-8 order-1 mr-2 ring-1 ring-border">
                        <AvatarImage src={selectedConversation?.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/20 text-xs text-primary">
                          {getInitials(selectedConversation?.name || "User")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-background/80 p-4">
          <div className="flex items-center gap-2 mb-2">
            {/* File Upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.txt"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-primary/20"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            {/* Emoji Picker */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/20">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                <div className="grid grid-cols-6 gap-2">
                  {emojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-lg"
                      onClick={() => addEmoji(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Voice Recording */}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-8 w-8 p-0 hover:bg-primary/20 ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : ''}`}
              onClick={startRecording}
            >
              {isRecording ? (
                <div className="flex items-center justify-center">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                </div>
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            
            <div className="flex-1" />
            
            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/20">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Image className="h-4 w-4 mr-2" />
                  Send Photo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <File className="h-4 w-4 mr-2" />
                  Send Document
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MapPin className="h-4 w-4 mr-2" />
                  Share Location
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="h-4 w-4 mr-2" />
                  Create Group
                </DropdownMenuItem>
                <DropdownMenuItem onClick={clearChat}>
                  <Archive className="h-4 w-4 mr-2" />
                  Clear Chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsSoundEnabled(!isSoundEnabled)}>
                  {isSoundEnabled ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
                  {isSoundEnabled ? 'Mute Notifications' : 'Enable Notifications'}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Search className="h-4 w-4 mr-2" />
                  Search Messages
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex gap-2 items-end">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className={`flex-1 border border-input bg-background/50 focus:ring-2 focus:ring-primary/5 focus:outline-none focus:border-primary/8 ${newMessage.trim() ? 'rounded-lg' : 'rounded-md'} resize-none overflow-hidden px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/5 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:bg-background/70`}
              style={{
                height: '40px',
                minHeight: '40px',
                maxHeight: '120px',
                lineHeight: '24px',
                paddingTop: '8px',
                paddingBottom: '8px',
                transition: 'height 0.15s ease-out',
                overflowY: 'hidden'
              }}
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                const value = target.value;
                
                // If text is empty, reset to starting height
                if (!value.trim()) {
                  target.style.height = '40px';
                  target.style.overflowY = 'hidden';
                  return;
                }
                
                // Reset height to measure content properly
                target.style.height = '40px';
                
                // Calculate new height based on scroll height
                const scrollHeight = target.scrollHeight;
                const newHeight = Math.min(Math.max(scrollHeight, 40), 120);
                
                // Apply the new height smoothly with the CSS transition
                target.style.height = newHeight + 'px';
                
                // Handle overflow when content exceeds max height
                target.style.overflowY = newHeight >= 120 ? 'auto' : 'hidden';
              }}
              onFocus={(e) => {
                const target = e.target as HTMLTextAreaElement;
                // Ensure proper height calculation on focus
                if (newMessage.trim()) {
                  const currentHeight = target.scrollHeight;
                  const newHeight = Math.min(Math.max(currentHeight, 40), 120);
                  target.style.height = newHeight + 'px';
                  target.style.overflowY = newHeight >= 120 ? 'auto' : 'hidden';
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' && !newMessage.trim()) {
                  e.preventDefault();
                }
              }}
            />
            <Button 
              onClick={sendMessage}
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 rounded-full w-10 h-10 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
            </div>
          </>
        )}
      </Card>
      </ChatThemeWrapper>
    </ChatThemeProvider>
  </ChatSettingsProvider>
  );
};

export default SlidingChatWindow;