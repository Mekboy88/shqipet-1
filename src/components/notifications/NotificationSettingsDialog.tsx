import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useNotificationSettings, type CategoryChannelSettings, type PriorityLevel } from '@/contexts/NotificationSettingsContext';
import { 
  Bell, 
  Mail, 
  Smartphone,
  MessageSquare,
  Shield, 
  Clock,
  Volume2,
  Eye,
  Trash2,
  RotateCcw,
  Settings,
  CheckCircle2,
  AlertCircle,
  Globe,
  Download,
  AtSign,
  MessageCircle,
  Heart,
  Share2,
  UserPlus,
  Users,
  Calendar,
  ShoppingBag,
  Lightbulb,
  Lock,
  Zap,
  Moon,
  Vibrate,
  Type
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
  const [activeTab, setActiveTab] = useState('channels');

  const updateCategoryChannel = (category: keyof typeof settings.categories, channel: keyof CategoryChannelSettings, value: boolean) => {
    updateSettings({
      categories: {
        ...settings.categories,
        [category]: {
          ...settings.categories[category],
          [channel]: value
        }
      }
    });
  };

  const categoryInfo = [
    { key: 'directMessages', label: 'Direct Messages', icon: MessageSquare, critical: true },
    { key: 'mentions', label: '@Mentions / Replies', icon: AtSign, critical: false },
    { key: 'comments', label: 'Comments on My Posts', icon: MessageCircle, critical: false },
    { key: 'reactions', label: 'Reactions/Likes', icon: Heart, critical: false },
    { key: 'shares', label: 'Shares/Reposts', icon: Share2, critical: false },
    { key: 'follows', label: 'Follows & Friend Requests', icon: UserPlus, critical: false },
    { key: 'groups', label: 'Group/Page Invites', icon: Users, critical: false },
    { key: 'events', label: 'Event Invites & Reminders', icon: Calendar, critical: false },
    { key: 'marketplace', label: 'Marketplace Updates', icon: ShoppingBag, critical: false },
    { key: 'recommendations', label: 'Recommendations', icon: Lightbulb, critical: false },
    { key: 'security', label: 'System & Security', icon: Shield, critical: true },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Settings</span>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="priority">Priority</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] pr-4">
            {/* CHANNELS TAB */}
            <TabsContent value="channels" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notification Channels</CardTitle>
                  <CardDescription>Choose how you want to receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <Label>In-App Notifications</Label>
                    </div>
                    <Switch
                      checked={settings.channels.inApp}
                      onCheckedChange={(checked) => updateSettings({ channels: { ...settings.channels, inApp: checked } })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <Label>Push Notifications</Label>
                    </div>
                    <Switch
                      checked={settings.channels.push}
                      onCheckedChange={(checked) => updateSettings({ channels: { ...settings.channels, push: checked } })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <Label>Email Notifications</Label>
                    </div>
                    <Switch
                      checked={settings.channels.email}
                      onCheckedChange={(checked) => updateSettings({ channels: { ...settings.channels, email: checked } })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <Label>SMS / WhatsApp</Label>
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    </div>
                    <Switch
                      checked={settings.channels.sms}
                      onCheckedChange={(checked) => updateSettings({ channels: { ...settings.channels, sms: checked } })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Delivery Frequency</CardTitle>
                  <CardDescription>Control when and how often you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Notification Frequency</Label>
                    <Select value={settings.frequency} onValueChange={(value: any) => updateSettings({ frequency: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="smart_digest_hourly">Smart Digest (Hourly)</SelectItem>
                        <SelectItem value="smart_digest_daily">Smart Digest (Daily)</SelectItem>
                        <SelectItem value="smart_digest_weekly">Smart Digest (Weekly)</SelectItem>
                        <SelectItem value="only_offline">Only When Offline</SelectItem>
                        <SelectItem value="mentions_only">Mentions Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Rate Limit</Label>
                      <span className="text-sm text-muted-foreground">{settings.rateLimit}/hour</span>
                    </div>
                    <Slider
                      value={[settings.rateLimit]}
                      onValueChange={([value]) => updateSettings({ rateLimit: value })}
                      min={1}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Maximum notifications per hour</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CATEGORIES TAB */}
            <TabsContent value="categories" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Event Categories</CardTitle>
                  <CardDescription>Configure channels for each type of notification</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                      <div className="col-span-1">Category</div>
                      <div className="text-center">In-App</div>
                      <div className="text-center">Push</div>
                      <div className="text-center">Email</div>
                      <div className="text-center">SMS</div>
                    </div>

                    {categoryInfo.map(({ key, label, icon: Icon, critical }) => (
                      <div key={key} className="grid grid-cols-5 gap-2 items-center">
                        <div className="col-span-1 flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="text-sm">{label}</span>
                          {critical && <Lock className="h-3 w-3 text-amber-500" />}
                        </div>
                        <div className="flex justify-center">
                          <Switch
                            checked={settings.categories[key as keyof typeof settings.categories].inApp}
                            onCheckedChange={(checked) => updateCategoryChannel(key as keyof typeof settings.categories, 'inApp', checked)}
                            disabled={critical}
                          />
                        </div>
                        <div className="flex justify-center">
                          <Switch
                            checked={settings.categories[key as keyof typeof settings.categories].push}
                            onCheckedChange={(checked) => updateCategoryChannel(key as keyof typeof settings.categories, 'push', checked)}
                          />
                        </div>
                        <div className="flex justify-center">
                          <Switch
                            checked={settings.categories[key as keyof typeof settings.categories].email}
                            onCheckedChange={(checked) => updateCategoryChannel(key as keyof typeof settings.categories, 'email', checked)}
                            disabled={critical && !settings.categories[key as keyof typeof settings.categories].email}
                          />
                        </div>
                        <div className="flex justify-center">
                          <Switch
                            checked={settings.categories[key as keyof typeof settings.categories].sms}
                            onCheckedChange={(checked) => updateCategoryChannel(key as keyof typeof settings.categories, 'sms', checked)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Critical security alerts cannot be fully disabled
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PRIORITY TAB */}
            <TabsContent value="priority" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Priority Levels</CardTitle>
                  <CardDescription>Assign priority levels to notification categories</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Show High Priority at Top</Label>
                    <Switch
                      checked={settings.prioritySettings.showHighAtTop}
                      onCheckedChange={(checked) => updateSettings({ prioritySettings: { ...settings.prioritySettings, showHighAtTop: checked } })}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    {Object.entries(settings.prioritySettings.categories).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                        <Select
                          value={value}
                          onValueChange={(newValue: PriorityLevel) => updateSettings({
                            prioritySettings: {
                              ...settings.prioritySettings,
                              categories: {
                                ...settings.prioritySettings.categories,
                                [key]: newValue
                              }
                            }
                          })}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">
                              <span className="flex items-center gap-2">
                                <AlertCircle className="h-3 w-3 text-red-500" />
                                High
                              </span>
                            </SelectItem>
                            <SelectItem value="normal">
                              <span className="flex items-center gap-2">
                                <Bell className="h-3 w-3 text-blue-500" />
                                Normal
                              </span>
                            </SelectItem>
                            <SelectItem value="low">
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-gray-400" />
                                Low
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SCHEDULE TAB */}
            <TabsContent value="schedule" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Do Not Disturb
                  </CardTitle>
                  <CardDescription>Schedule quiet hours when notifications are paused</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Do Not Disturb</Label>
                    <Switch
                      checked={settings.dnd.enabled}
                      onCheckedChange={(checked) => updateSettings({ dnd: { ...settings.dnd, enabled: checked } })}
                    />
                  </div>

                  {settings.dnd.enabled && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Start Time</Label>
                          <Select 
                            value={settings.dnd.startTime} 
                            onValueChange={(value) => updateSettings({ dnd: { ...settings.dnd, startTime: value } })}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => {
                                const hour = i.toString().padStart(2, '0');
                                return <SelectItem key={`${hour}:00`} value={`${hour}:00`}>{hour}:00</SelectItem>;
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>End Time</Label>
                          <Select 
                            value={settings.dnd.endTime} 
                            onValueChange={(value) => updateSettings({ dnd: { ...settings.dnd, endTime: value } })}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => {
                                const hour = i.toString().padStart(2, '0');
                                return <SelectItem key={`${hour}:00`} value={`${hour}:00`}>{hour}:00</SelectItem>;
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="mb-2 block">Active Days</Label>
                        <div className="flex gap-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                            <Button
                              key={day}
                              variant={settings.dnd.days[i] ? 'default' : 'outline'}
                              size="sm"
                              className="w-12"
                              onClick={() => {
                                const newDays = [...settings.dnd.days];
                                newDays[i] = !newDays[i];
                                updateSettings({ dnd: { ...settings.dnd, days: newDays } });
                              }}
                            >
                              {day}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Allow Priority Through</Label>
                        <Switch
                          checked={settings.dnd.allowPriority}
                          onCheckedChange={(checked) => updateSettings({ dnd: { ...settings.dnd, allowPriority: checked } })}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Digests & Summaries</CardTitle>
                  <CardDescription>Receive periodic summaries of your notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Daily Recap</Label>
                    <Switch
                      checked={settings.digest.dailyRecap}
                      onCheckedChange={(checked) => updateSettings({ digest: { ...settings.digest, dailyRecap: checked } })}
                    />
                  </div>

                  {settings.digest.dailyRecap && (
                    <div>
                      <Label>Time</Label>
                      <Select 
                        value={settings.digest.dailyTime}
                        onValueChange={(value) => updateSettings({ digest: { ...settings.digest, dailyTime: value } })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0');
                            return <SelectItem key={`${hour}:00`} value={`${hour}:00`}>{hour}:00</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <Label>Weekly Summary</Label>
                    <Switch
                      checked={settings.digest.weeklySummary}
                      onCheckedChange={(checked) => updateSettings({ digest: { ...settings.digest, weeklySummary: checked } })}
                    />
                  </div>

                  {settings.digest.weeklySummary && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Day</Label>
                        <Select 
                          value={settings.digest.weeklyDay.toString()}
                          onValueChange={(value) => updateSettings({ digest: { ...settings.digest, weeklyDay: parseInt(value) } })}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                              <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Time</Label>
                        <Select 
                          value={settings.digest.weeklyTime}
                          onValueChange={(value) => updateSettings({ digest: { ...settings.digest, weeklyTime: value } })}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => {
                              const hour = i.toString().padStart(2, '0');
                              return <SelectItem key={`${hour}:00`} value={`${hour}:00`}>{hour}:00</SelectItem>;
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Include in Digest:</Label>
                    {[
                      { key: 'includeTopMentions', label: 'Top Mentions' },
                      { key: 'includeTrendingPosts', label: 'Trending Posts You Follow' },
                      { key: 'includeUnresolvedRequests', label: 'Unresolved Requests' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label className="font-normal">{label}</Label>
                        <Switch
                          checked={settings.digest[key as keyof typeof settings.digest] as boolean}
                          onCheckedChange={(checked) => updateSettings({ digest: { ...settings.digest, [key]: checked } })}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ADVANCED TAB */}
            <TabsContent value="advanced" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Security & Login Alerts</CardTitle>
                  <CardDescription>Critical security notifications (cannot be fully disabled)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: 'newLogin', label: 'New Device/Location Login', icon: Shield },
                    { key: 'passwordChange', label: 'Password/MFA Changes', icon: Lock },
                    { key: 'sessionExpired', label: 'Session Expired', icon: Clock }
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <Label>{label}</Label>
                      </div>
                      <Switch
                        checked={settings.security[key as keyof typeof settings.security]}
                        onCheckedChange={(checked) => updateSettings({ security: { ...settings.security, [key]: checked } })}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Privacy & Read Receipts</CardTitle>
                  <CardDescription>Control what others can see about your activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Read Receipts</Label>
                      <p className="text-xs text-muted-foreground">Let senders know when you've read notifications</p>
                    </div>
                    <Switch
                      checked={settings.privacy.showReadReceipts}
                      onCheckedChange={(checked) => updateSettings({ privacy: { ...settings.privacy, showReadReceipts: checked } })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Active Status</Label>
                      <p className="text-xs text-muted-foreground">Show when you're active to senders</p>
                    </div>
                    <Switch
                      checked={settings.privacy.showActiveStatus}
                      onCheckedChange={(checked) => updateSettings({ privacy: { ...settings.privacy, showActiveStatus: checked } })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Accessibility</CardTitle>
                  <CardDescription>Customize notification appearance and alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      <Label>Sound Alerts</Label>
                    </div>
                    <Switch
                      checked={settings.accessibility.sound}
                      onCheckedChange={(checked) => updateSettings({ accessibility: { ...settings.accessibility, sound: checked } })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Vibrate className="h-4 w-4" />
                      <Label>Vibration</Label>
                    </div>
                    <Switch
                      checked={settings.accessibility.vibration}
                      onCheckedChange={(checked) => updateSettings({ accessibility: { ...settings.accessibility, vibration: checked } })}
                    />
                  </div>

                  {settings.accessibility.vibration && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Vibration Intensity</Label>
                        <span className="text-sm text-muted-foreground">{settings.accessibility.vibrationIntensity}/3</span>
                      </div>
                      <Slider
                        value={[settings.accessibility.vibrationIntensity]}
                        onValueChange={([value]) => updateSettings({ accessibility: { ...settings.accessibility, vibrationIntensity: value } })}
                        min={1}
                        max={3}
                        step={1}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <Label>Badge Count</Label>
                    </div>
                    <Switch
                      checked={settings.accessibility.badgeCount}
                      onCheckedChange={(checked) => updateSettings({ accessibility: { ...settings.accessibility, badgeCount: checked } })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      <Label>Large Notification Text</Label>
                    </div>
                    <Switch
                      checked={settings.accessibility.largeText}
                      onCheckedChange={(checked) => updateSettings({ accessibility: { ...settings.accessibility, largeText: checked } })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Data & Retention</CardTitle>
                  <CardDescription>Manage your notification history</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Keep notifications for</Label>
                    <Select 
                      value={settings.retention.keepDays.toString()}
                      onValueChange={(value) => updateSettings({ retention: { keepDays: parseInt(value) } })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">365 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Notification History
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear History (Non-Critical)
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Localization
                  </CardTitle>
                  <CardDescription>Language and time preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Language</Label>
                    <Select 
                      value={settings.localization.language}
                      onValueChange={(value) => updateSettings({ localization: { ...settings.localization, language: value } })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sq">Shqip (Albanian)</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Time Format</Label>
                    <Select 
                      value={settings.localization.timeFormat}
                      onValueChange={(value: '12h' | '24h') => updateSettings({ localization: { ...settings.localization, timeFormat: value } })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour</SelectItem>
                        <SelectItem value="24h">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <Button variant="ghost" onClick={resetSettings} className="text-xs">
            <RotateCcw className="h-3 w-3 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettingsDialog;
