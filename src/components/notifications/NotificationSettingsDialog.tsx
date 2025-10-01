import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationSettings } from '@/contexts/NotificationSettingsContext';
import { 
  Bell, 
  Mail, 
  Monitor, 
  Shield, 
  User, 
  Settings, 
  AlertTriangle,
  Clock,
  Volume2,
  Eye,
  Trash2,
  RotateCcw
} from 'lucide-react';

interface NotificationSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettingsDialog: React.FC<NotificationSettingsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSettings, resetSettings } = useNotificationSettings();

  const handleSwitchChange = (key: keyof typeof settings) => (checked: boolean) => {
    updateSettings({ [key]: checked });
  };

  const handleSelectChange = (key: keyof typeof settings) => (value: string) => {
    updateSettings({ [key]: key.includes('Hours') ? value : Number(value) });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Settings</span>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(80vh-120px)]">
          <div className="space-y-6 p-1">
            {/* Notification Types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Notification Types</span>
                </CardTitle>
                <CardDescription>
                  Choose which types of notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-red-500" />
                    <Label htmlFor="security">Security Notifications</Label>
                  </div>
                  <Switch
                    id="security"
                    checked={settings.enableSecurityNotifications}
                    onCheckedChange={handleSwitchChange('enableSecurityNotifications')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-purple-500" />
                    <Label htmlFor="account">Account Notifications</Label>
                  </div>
                  <Switch
                    id="account"
                    checked={settings.enableAccountNotifications}
                    onCheckedChange={handleSwitchChange('enableAccountNotifications')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="system">System Notifications</Label>
                  </div>
                  <Switch
                    id="system"
                    checked={settings.enableSystemNotifications}
                    onCheckedChange={handleSwitchChange('enableSystemNotifications')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-blue-500" />
                    <Label htmlFor="updates">Update Notifications</Label>
                  </div>
                  <Switch
                    id="updates"
                    checked={settings.enableUpdateNotifications}
                    onCheckedChange={handleSwitchChange('enableUpdateNotifications')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Priority Levels */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Priority Levels</span>
                </CardTitle>
                <CardDescription>
                  Select which priority levels to display
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="high-priority">High Priority</Label>
                  <Switch
                    id="high-priority"
                    checked={settings.showHighPriority}
                    onCheckedChange={handleSwitchChange('showHighPriority')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="medium-priority">Medium Priority</Label>
                  <Switch
                    id="medium-priority"
                    checked={settings.showMediumPriority}
                    onCheckedChange={handleSwitchChange('showMediumPriority')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="low-priority">Low Priority</Label>
                  <Switch
                    id="low-priority"
                    checked={settings.showLowPriority}
                    onCheckedChange={handleSwitchChange('showLowPriority')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Channels */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Notification Channels</span>
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4" />
                    <Label htmlFor="in-app">In-App Notifications</Label>
                  </div>
                  <Switch
                    id="in-app"
                    checked={settings.enableInAppNotifications}
                    onCheckedChange={handleSwitchChange('enableInAppNotifications')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <Label htmlFor="email">Email Notifications</Label>
                  </div>
                  <Switch
                    id="email"
                    checked={settings.enableEmailNotifications}
                    onCheckedChange={handleSwitchChange('enableEmailNotifications')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4" />
                    <Label htmlFor="desktop">Desktop Notifications</Label>
                  </div>
                  <Switch
                    id="desktop"
                    checked={settings.enableDesktopNotifications}
                    onCheckedChange={handleSwitchChange('enableDesktopNotifications')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Timing Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Timing Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure when and how notifications behave
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
                  <Switch
                    id="quiet-hours"
                    checked={settings.enableQuietHours}
                    onCheckedChange={handleSwitchChange('enableQuietHours')}
                  />
                </div>
                
                {settings.enableQuietHours && (
                  <div className="grid grid-cols-2 gap-4 ml-4">
                    <div>
                      <Label htmlFor="quiet-start">Start Time</Label>
                      <Select value={settings.quietHoursStart} onValueChange={handleSelectChange('quietHoursStart')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0');
                            return (
                              <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                                {hour}:00
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="quiet-end">End Time</Label>
                      <Select value={settings.quietHoursEnd} onValueChange={handleSelectChange('quietHoursEnd')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0');
                            return (
                              <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                                {hour}:00
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="auto-read">Auto-mark as read after (minutes, 0 to disable)</Label>
                  <Select 
                    value={settings.autoMarkAsReadAfter.toString()} 
                    onValueChange={handleSelectChange('autoMarkAsReadAfter')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Disabled</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Display Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Display Options</span>
                </CardTitle>
                <CardDescription>
                  Customize how notifications appear and behave
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4" />
                    <Label htmlFor="sound">Sound Alerts</Label>
                  </div>
                  <Switch
                    id="sound"
                    checked={settings.enableSoundAlerts}
                    onCheckedChange={handleSwitchChange('enableSoundAlerts')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <Label htmlFor="visual">Visual Alerts</Label>
                  </div>
                  <Switch
                    id="visual"
                    checked={settings.enableVisualAlerts}
                    onCheckedChange={handleSwitchChange('enableVisualAlerts')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Trash2 className="h-4 w-4" />
                  <span>Data Management</span>
                </CardTitle>
                <CardDescription>
                  Manage your notification data and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="retention">Keep notifications for</Label>
                  <Select 
                    value={settings.retentionDays.toString()} 
                    onValueChange={handleSelectChange('retentionDays')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <Button
                  variant="outline"
                  onClick={resetSettings}
                  className="w-full flex items-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset to Defaults</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettingsDialog;