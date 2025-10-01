import React from 'react';
import { X, Bell, CheckCircle, AlertCircle, Info, Settings, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/security/use-notifications';
import { useNotificationSettings } from '@/contexts/NotificationSettingsContext';
import NotificationSettingsDialog from './NotificationSettingsDialog';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);
  
  const { 
    notifications: realNotifications, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    getUnreadCount 
  } = useNotifications();
  
  const { settings } = useNotificationSettings();

  // Create mock notifications for demonstration if no real ones exist
  const mockNotifications = [
    {
      id: '1',
      title: 'Security Scan Complete',
      description: 'Your security scan has completed successfully. 5 vulnerabilities found.',
      type: 'security',
      priority: 'high',
      status: 'unread',
      linked_module: 'security',
      linked_scan_id: 'scan-123',
      tags: ['security', 'scan'],
      source: 'security_scanner',
      user_id: 'user-123',
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      title: 'Profile Updated',
      description: 'Your profile information has been successfully updated',
      type: 'account',
      priority: 'low',
      status: 'read',
      linked_module: 'profile',
      linked_scan_id: '',
      tags: ['profile', 'update'],
      source: 'user_action',
      user_id: 'user-123',
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      title: 'System Maintenance',
      description: 'Scheduled maintenance will occur tonight from 2-4 AM EST',
      type: 'system',
      priority: 'medium',
      status: 'unread',
      linked_module: 'system',
      linked_scan_id: '',
      tags: ['maintenance', 'system'],
      source: 'system',
      user_id: 'user-123',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      title: 'New Feature Available',
      description: 'Check out our new dashboard analytics feature',
      type: 'update',
      priority: 'low',
      status: 'unread',
      linked_module: 'features',
      linked_scan_id: '',
      tags: ['feature', 'update'],
      source: 'product_team',
      user_id: 'user-123',
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const notifications = realNotifications && realNotifications.length > 0 ? realNotifications : mockNotifications;

  // Filter notifications based on selected category and user settings
  const filteredNotifications = React.useMemo(() => {
    let filtered = notifications;
    
    // Apply user settings filters
    filtered = filtered.filter(n => {
      // Filter by notification type settings
      switch (n.type) {
        case 'security':
        case 'warning':
        case 'error':
          return settings.enableSecurityNotifications;
        case 'account':
        case 'profile':
          return settings.enableAccountNotifications;
        case 'system':
          return settings.enableSystemNotifications;
        case 'update':
        case 'feature':
          return settings.enableUpdateNotifications;
        default:
          return true;
      }
    });
    
    // Filter by priority settings
    filtered = filtered.filter(n => {
      switch (n.priority) {
        case 'high':
          return settings.showHighPriority;
        case 'medium':
          return settings.showMediumPriority;
        case 'low':
          return settings.showLowPriority;
        default:
          return true;
      }
    });
    
    // Apply category filter if selected
    if (selectedCategory) {
      filtered = filtered.filter(n => {
        switch (selectedCategory) {
          case 'updates': return n.type === 'update' || n.type === 'feature';
          case 'alerts': return n.type === 'security' || n.type === 'warning' || n.type === 'error';
          case 'system': return n.type === 'system';
          case 'account': return n.type === 'account' || n.type === 'profile';
          default: return true;
        }
      });
    }
    
    return filtered;
  }, [notifications, settings, selectedCategory]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = async (notificationId: string, status: string) => {
    if (status === 'unread') {
      try {
        await markAsRead.mutateAsync(notificationId);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'security':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'account':
      case 'profile':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />;
      case 'update':
      case 'feature':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <>
      {/* Invisible backdrop for closing */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
      )}

      {/* Notification Panel */}
      <div className={`
        fixed top-16 right-0 ${isExpanded ? 'h-[calc(100vh-4rem)]' : 'h-1/2'} w-80 bg-white shadow-2xl z-50 
        transform transition-all duration-300 ease-in-out border-l border-gray-200
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-red-500/10 to-gray-800/10">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <Badge variant="secondary" className="bg-red-500 text-white">
                {notifications.filter(n => n.status === 'unread').length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Quick Actions */}
              <Card className="p-3 bg-gradient-to-r from-red-50 to-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Quick Actions</span>
                  <Settings className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex space-x-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => setShowSettings(true)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Button>
                </div>
              </Card>

              <Separator />

              {/* Notifications List */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-600">Recent Notifications</h4>
                {filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      notification.status === 'unread' ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
                    }`}
                    onClick={() => handleNotificationClick(notification.id, notification.status)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h5 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h5>
                          {notification.status === 'unread' && (
                            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 ml-2 mt-1"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {notification.description}
                        </p>
                        <span className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Categories */}
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-600">Categories</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={selectedCategory === 'updates' ? "default" : "outline"}
                    size="sm" 
                    className="justify-start text-xs"
                    onClick={() => setSelectedCategory(selectedCategory === 'updates' ? null : 'updates')}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Updates
                  </Button>
                  <Button 
                    variant={selectedCategory === 'alerts' ? "default" : "outline"}
                    size="sm" 
                    className="justify-start text-xs"
                    onClick={() => setSelectedCategory(selectedCategory === 'alerts' ? null : 'alerts')}
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Alerts
                  </Button>
                  <Button 
                    variant={selectedCategory === 'system' ? "default" : "outline"}
                    size="sm" 
                    className="justify-start text-xs"
                    onClick={() => setSelectedCategory(selectedCategory === 'system' ? null : 'system')}
                  >
                    <Info className="h-3 w-3 mr-1" />
                    System
                  </Button>
                  <Button 
                    variant={selectedCategory === 'account' ? "default" : "outline"}
                    size="sm" 
                    className="justify-start text-xs"
                    onClick={() => setSelectedCategory(selectedCategory === 'account' ? null : 'account')}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Account
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <Button 
              variant="outline" 
              className="w-full text-sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse View' : 'View All Notifications'}
            </Button>
          </div>
        </div>
      </div>
      
      <NotificationSettingsDialog 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};

export default NotificationPanel;