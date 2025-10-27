import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  Paperclip,
  Smile,
  Mic,
  Send,
  Check,
  CheckCheck,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  text?: string;
  sender: 'user' | 'contact';
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  images?: { url: string; size?: string }[];
  file?: { name: string; size: string; pages: number };
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread?: number;
  online?: boolean;
  status?: string;
  typing?: boolean;
}

interface Status {
  id: string;
  name: string;
  avatar: string;
}

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const [selectedContact, setSelectedContact] = useState<Contact>({
    id: '1',
    name: 'Lea',
    avatar: '/placeholder.svg',
    lastMessage: 'What are you doing',
    timestamp: '22/10/23',
    online: true
  });

  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const statuses: Status[] = [
    { id: '1', name: 'My Status', avatar: '/placeholder.svg' },
    { id: '2', name: 'Jesus ...', avatar: '/placeholder.svg' },
    { id: '3', name: 'Mari', avatar: '/placeholder.svg' },
    { id: '4', name: 'Kristin ...', avatar: '/placeholder.svg' },
    { id: '5', name: 'Lea', avatar: '/placeholder.svg' }
  ];

  const contacts: Contact[] = [
    { 
      id: '1', 
      name: 'Josephin water', 
      avatar: '/placeholder.svg', 
      lastMessage: 'Typing...', 
      timestamp: '22/10/23',
      typing: true
    },
    { 
      id: '2', 
      name: 'Mari', 
      avatar: '/placeholder.svg', 
      lastMessage: 'This is nice, I love it ❤️', 
      timestamp: 'JUST NOW',
      online: true
    },
    { 
      id: '3', 
      name: 'Lea', 
      avatar: '/placeholder.svg', 
      lastMessage: 'What are you doing', 
      timestamp: '22/10/23',
      online: true
    },
    { 
      id: '4', 
      name: 'Kristin Watson', 
      avatar: '/placeholder.svg', 
      lastMessage: 'Okay I will try it 😊', 
      timestamp: 'Yesterday'
    },
    { 
      id: '5', 
      name: '15 Rocks', 
      avatar: '/placeholder.svg', 
      lastMessage: 'You : This is COOL', 
      timestamp: '18/08/2024'
    },
    { 
      id: '6', 
      name: 'Jesus Watson', 
      avatar: '/placeholder.svg', 
      lastMessage: 'Sent you image', 
      timestamp: '14/12/24'
    }
  ];

  const messages: Message[] = [
    {
      id: '1',
      text: "Hi Angelo! Let's go out",
      sender: 'contact',
      timestamp: '01:42 AM',
      status: 'read'
    },
    {
      id: '2',
      text: 'I have vacation plan in Ladakh for next week.',
      sender: 'user',
      timestamp: '01:35 AM'
    },
    {
      id: '3',
      text: 'You understand',
      sender: 'contact',
      timestamp: '01:35 AM'
    },
    {
      id: '4',
      images: [
        { url: '/placeholder.svg', size: '53 MB' },
        { url: '/placeholder.svg' },
        { url: '/placeholder.svg' },
        { url: '/placeholder.svg' }
      ],
      sender: 'contact',
      timestamp: '01:42 AM'
    },
    {
      id: '5',
      text: 'You understand',
      sender: 'contact',
      timestamp: '01:42 AM'
    },
    {
      id: '6',
      file: {
        name: 'Smitten Shah 01.pdf',
        size: '1 Page | 250 Kb',
        pages: 1
      },
      sender: 'user',
      timestamp: '01:40 AM',
      status: 'read'
    }
  ];

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      {/* Left Sidebar */}
      <div className="w-[360px] bg-white border-r border-gray-200 flex flex-col">
        {/* Profile Header */}
        <div className="p-4 bg-[#4a9b7f] text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>RS</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">Rohini Sharma</h3>
                <p className="text-xs text-white/80">Busy</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/20">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Status Section */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Status</h3>
            <button className="text-xs text-[#4a9b7f] hover:underline">View All</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {statuses.map((status) => (
              <div key={status.id} className="flex flex-col items-center gap-1 min-w-[60px]">
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-[#4a9b7f]">
                    <AvatarImage src={status.avatar} />
                    <AvatarFallback>{status.name[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-[10px] text-gray-600 truncate w-full text-center">
                  {status.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Message List Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Message (10)</h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Search className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
          
          {/* Chat/Call/Contact Tabs */}
          <div className="flex gap-2 mb-3">
            <Button variant="ghost" size="sm" className="flex-1 h-8 bg-gray-100 text-gray-900 text-xs">
              💬 Chat
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 h-8 text-gray-600 text-xs">
              📞 Call
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 h-8 text-gray-600 text-xs">
              👥 Contact
            </Button>
          </div>

          {/* Direct/Group Tabs */}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1 h-8 bg-gray-100 text-gray-900 text-xs">
              Direct
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 h-8 text-gray-600 text-xs">
              Group
            </Button>
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                selectedContact.id === contact.id ? 'bg-gray-50' : ''
              }`}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback>{contact.name[0]}</AvatarFallback>
                </Avatar>
                {contact.online && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">{contact.name}</h4>
                  <span className="text-xs text-gray-500">{contact.timestamp}</span>
                </div>
                <p className={`text-xs ${contact.typing ? 'text-green-600' : 'text-gray-600'} truncate`}>
                  {contact.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#e5ddd5] min-h-0">
        {/* Chat Header */}
        <div className="bg-[#f0f2f5] px-4 py-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedContact.avatar} />
              <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{selectedContact.name}</h3>
              <p className="text-xs text-green-600">Online</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Video className="h-5 w-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Search className="h-5 w-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Phone className="h-5 w-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Phone className="h-5 w-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Info className="h-5 w-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'contact' && (
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={selectedContact.avatar} />
                  <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
                </Avatar>
              )}
              
              <div className={`max-w-[65%] ${message.sender === 'user' ? 'ml-auto' : ''}`}>
                {message.text && (
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      message.sender === 'user'
                        ? 'bg-[#d9fdd3] text-gray-900'
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-gray-500">{message.timestamp}</span>
                      {message.sender === 'user' && message.status === 'read' && (
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                  </div>
                )}

                {message.images && (
                  <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden bg-white p-1">
                    {message.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img.url}
                          alt=""
                          className="w-full h-32 object-cover rounded"
                        />
                        {idx === 0 && img.size && (
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                            👍 {img.size}
                          </div>
                        )}
                        {idx === 3 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-lg font-semibold">
                            10+
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {message.file && (
                  <div className="bg-[#d9fdd3] rounded-lg p-3 flex items-center gap-3">
                    <div className="h-12 w-12 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                      PDF
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{message.file.name}</p>
                      <p className="text-xs text-gray-600">{message.file.size}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/50 rounded-full">
                      <Download className="h-4 w-4 text-gray-700" />
                    </Button>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-500">{message.timestamp}</span>
                      {message.status === 'read' && (
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
            <svg className="h-6 w-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
            </svg>
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
            <Paperclip className="h-5 w-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
            <Smile className="h-5 w-5 text-gray-600" />
          </Button>
          
          <Input
            type="text"
            placeholder="Write your message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="flex-1 bg-white border-gray-300 rounded-full"
          />
          
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
            <Mic className="h-5 w-5 text-gray-600" />
          </Button>
          <Button size="sm" className="h-9 w-9 p-0 bg-[#4a9b7f] hover:bg-[#3d8269] text-white rounded-full">
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* RTL & Plus Buttons */}
        <div className="absolute bottom-20 right-6 flex flex-col gap-3">
          <Button className="h-12 w-12 rounded-full bg-[#25d366] hover:bg-[#20bd5a] text-white shadow-lg">
            <span className="text-sm font-bold">RTL</span>
          </Button>
          <Button className="h-12 w-12 rounded-full bg-[#25d366] hover:bg-[#20bd5a] text-white shadow-lg">
            <span className="text-2xl">+</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Messages;
