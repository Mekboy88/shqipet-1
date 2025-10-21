import React from 'react';
import { X, Settings, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/security/use-notifications';
import NotificationSettingsDialog from './NotificationSettingsDialog';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = React.useState<'all' | 'mentions' | 'unread'>('all');
  const [showSettings, setShowSettings] = React.useState(false);

  
  const { 
    notifications: realNotifications, 
    markAsRead, 
    markAllAsRead
  } = useNotifications();

  // Create mock notifications matching the reference image
  const mockNotifications = [
    {
      id: '1',
      users: ['Alena King', 'Thomas Partey'],
      avatars: ['/placeholder.svg', '/placeholder.svg'],
      action: 'commented in',
      subject: 'Dashboard V2',
      date: 'Apr 14',
      metadata: '21 comments',
      status: 'unread',
      type: 'comment'
    },
    {
      id: '2',
      users: ['Thomas Partey'],
      avatars: ['/placeholder.svg'],
      action: 'Invited you to a project',
      subject: 'NetNest',
      date: 'Apr 14',
      metadata: 'Design',
      status: 'read',
      type: 'invitation',
      hasActions: true
    },
    {
      id: '3',
      users: ['Thomas Partey'],
      avatars: ['/placeholder.svg'],
      action: 'added new project',
      subject: 'NetNest',
      date: 'Apr 13',
      metadata: 'Design',
      status: 'unread',
      type: 'project'
    },
    {
      id: '4',
      users: ['Justin Keith'],
      avatars: ['/placeholder.svg'],
      action: 'added new project',
      subject: 'Signature Spark',
      date: 'Apr 10',
      metadata: 'Testing',
      status: 'read',
      type: 'project'
    },
    {
      id: '5',
      users: ['Maria Joyce'],
      avatars: ['/placeholder.svg'],
      action: 'mentioned you in',
      subject: 'Pixel Pulse',
      date: 'Apr 02',
      metadata: '3 comments',
      status: 'read',
      type: 'mention'
    },
    {
      id: '6',
      users: ['Adam Maccall'],
      avatars: ['/placeholder.svg'],
      action: 'shared a file',
      subject: 'Design Requirements',
      date: 'Mar 31',
      metadata: 'Design',
      status: 'read',
      type: 'file',
      file: {
        name: 'Design_requirements_D2361.pdf',
        size: '4.2MB',
        type: 'pdf'
      }
    }
  ];

  const notifications = mockNotifications;

  // Filter notifications based on active tab
  const filteredNotifications = React.useMemo(() => {
    if (activeTab === 'mentions') {
      return notifications.filter(n => n.type === 'mention');
    }
    if (activeTab === 'unread') {
      return notifications.filter(n => n.status === 'unread');
    }
    return notifications;
  }, [notifications, activeTab]);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;


  const handleMarkAllRead = async () => {
    // Mark all as read logic
    console.log('Mark all as read');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/5"
        onClick={onClose}
      />

      {/* Notification Panel */}
      <div className="fixed top-14 right-4 w-[588px] max-h-[calc(100vh-80px)] bg-white rounded-lg shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900">Notification</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="h-5 w-5 text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs and Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'all' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              View all
            </button>
            <button
              onClick={() => setActiveTab('mentions')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'mentions' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Mentions
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'unread' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
          <button
            onClick={handleMarkAllRead}
            className="text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors"
          >
            Mark all as read
          </button>
        </div>

        {/* Notifications List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors relative">
                {/* Unread Indicator */}
                {notification.status === 'unread' && (
                  <div className="absolute left-2 top-7 w-2 h-2 bg-blue-500 rounded-full" />
                )}
                
                {/* Avatar(s) */}
                <div className="relative flex-shrink-0">
                  {notification.avatars.length === 1 ? (
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={notification.avatars[0]} />
                      <AvatarFallback>{notification.users[0].charAt(0)}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12 border-2 border-white">
                        <AvatarImage src={notification.avatars[0]} />
                        <AvatarFallback>{notification.users[0].charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-12 w-12 -ml-3 border-2 border-white">
                        <AvatarImage src={notification.avatars[1]} />
                        <AvatarFallback>{notification.users[1].charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{notification.users.join(' and ')}</span>
                    {' '}{notification.action}{' '}
                    <span className="font-semibold">{notification.subject}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {notification.date} · {notification.metadata}
                  </p>

                  {/* Action Buttons */}
                  {notification.hasActions && (
                    <div className="flex items-center gap-3 mt-3">
                      <Button 
                        variant="outline" 
                        className="h-9 px-6 text-sm font-medium border-gray-300 hover:bg-gray-50"
                      >
                        Decline
                      </Button>
                      <Button 
                        className="h-9 px-6 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Accept
                      </Button>
                    </div>
                  )}

                  {/* File Attachment */}
                  {notification.file && (
                    <div className="flex items-center justify-between p-4 mt-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-red-500 rounded flex items-center justify-center">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{notification.file.name}</p>
                          <p className="text-sm text-gray-500">{notification.file.size}</p>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                        <Download className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      <NotificationSettingsDialog 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};

export default NotificationPanel;