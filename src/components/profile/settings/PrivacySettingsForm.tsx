import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, MessageSquare, Users, Eye, Search, FileText, AlertCircle, Settings, Megaphone, Loader2 } from 'lucide-react';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface PrivacySettingsFormProps {
  userInfo: {
    [key: string]: any;
  };
  setUserInfo: React.Dispatch<React.SetStateAction<any>>;
}

const PrivacySettingsForm: React.FC<PrivacySettingsFormProps> = ({ userInfo, setUserInfo }) => {
  const { settings, loading, saving, updateSettings, resetToDefaults } = usePrivacySettings();
  const [showResetDialog, setShowResetDialog] = React.useState(false);

  // Sync settings to parent component
  useEffect(() => {
    if (!loading && settings) {
      setUserInfo((prev: any) => ({ ...prev, ...settings }));
    }
  }, [settings, loading, setUserInfo]);

  const handleSelectChange = (field: string, value: string) => {
    updateSettings({ [field]: value });
  };

  const handleSwitchChange = (field: string, checked: boolean) => {
    // For legacy yes/no fields
    if (field.startsWith('privacy_') && (field.includes('confirm') || field.includes('show') || field.includes('share') || field.includes('allow'))) {
      updateSettings({ [field]: checked ? 'yes' : 'no' });
    } else {
      updateSettings({ [field]: checked });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const privacyOptions = {
    follow: ['Everyone', 'People I Follow'],
    message: ['Everyone', 'People I Follow'],
    friends: ['Everyone', 'People I Follow', 'No body'],
    timeline: ['Everyone', 'People I Follow', 'No body'],
    birthday: ['Everyone', 'People I Follow', 'No body'],
    status: ['Online', 'Offline'],
    posts: ['Everyone', 'Followers', 'People I Follow', 'No one'],
    requests: ['Everyone', 'Friends of friends', 'No one'],
    visibility: ['Only me', 'People I Follow', 'Followers', 'Everyone'],
    birthdayDetail: ['Only me', 'People I Follow', 'Followers', 'Everyone', 'Day+Month only'],
    stories: ['Everyone', 'Followers', 'Close friends', 'Custom'],
    storyReplies: ['Everyone', 'Followers', 'Off'],
    messageFilter: ['Strict', 'Standard', 'Open'],
    contentFilter: ['Strict', 'Standard'],
  };

  const profileVisibilitySettings = [
    { id: 'privacy_who_can_follow_me', label: 'Who can follow me?', options: privacyOptions.follow },
    { id: 'privacy_who_can_see_my_friends', label: 'Who can see my friends?', options: privacyOptions.friends },
    { id: 'privacy_who_can_see_my_birthday', label: 'Who can see my birthday?', options: privacyOptions.birthday },
    { id: 'privacy_status', label: 'Status', options: privacyOptions.status },
  ];

  const communicationSettings = [
    { id: 'privacy_who_can_message_me', label: 'Who can message me?', options: privacyOptions.message },
    { id: 'privacy_who_can_post_on_my_timeline', label: 'Who can post on my timeline?', options: privacyOptions.timeline },
  ];

  const activitySettings = [
    { id: 'privacy_confirm_request_when_someone_follows_you', label: 'Confirm request when someone follows you?' },
    { id: 'privacy_show_my_activities', label: 'Show my activities?' },
  ];

  const locationAndIndexingSettings = [
    { id: 'privacy_share_my_location_with_public', label: 'Share my location with public?' },
    { id: 'privacy_allow_search_engines_to_index', label: 'Allow search engines to index my profile and posts?' },
  ];

  const toValue = (option: string) => option.toLowerCase().replace(/ /g, '_').replace(/\+/g, '_');

  const SettingRow = ({ id, label, helperText, children }: any) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <Label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </Label>
        {children}
      </div>
      {helperText && (
        <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {saving && (
        <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </div>
      )}

      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          onClick={() => setShowResetDialog(true)}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Profile Visibility */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
              <Eye className="h-5 w-5 text-blue-500" />
              <h3 className="text-xl font-semibold text-gray-800">Profile Visibility</h3>
            </div>
            
            <div className="space-y-4">
              {profileVisibilitySettings.map((setting) => (
                <SettingRow key={setting.id} id={setting.id} label={setting.label} helperText="Controls who can see this information">
                  <Select value={settings[setting.id]} onValueChange={(value) => handleSelectChange(setting.id, value)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover pointer-events-auto">
                      {setting.options.map(opt => (
                        <SelectItem key={opt} value={toValue(opt)}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>
              ))}
            </div>
          </div>

          {/* Timeline, Tagging & Mentions */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
              <MessageSquare className="h-5 w-5 text-green-500" />
              <h3 className="text-xl font-semibold text-gray-800">Timeline & Mentions</h3>
            </div>
            
            <div className="space-y-4">
              <SettingRow id="who_can_comment_on_posts" label="Who can comment on my posts?" helperText="Control who can add comments">
                <Select value={settings.who_can_comment_on_posts} onValueChange={(v) => handleSelectChange('who_can_comment_on_posts', v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover pointer-events-auto">
                    {privacyOptions.posts.map(opt => (
                      <SelectItem key={opt} value={toValue(opt)}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow id="who_can_share_posts" label="Who can share my posts?" helperText="Control sharing permissions">
                <Select value={settings.who_can_share_posts} onValueChange={(v) => handleSelectChange('who_can_share_posts', v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover pointer-events-auto">
                    {privacyOptions.posts.map(opt => (
                      <SelectItem key={opt} value={toValue(opt)}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow id="who_can_mention_me" label="Who can mention me?" helperText="Mentions can notify you and appear in search">
                <Select value={settings.who_can_mention_me} onValueChange={(v) => handleSelectChange('who_can_mention_me', v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover pointer-events-auto">
                    {privacyOptions.posts.map(opt => (
                      <SelectItem key={opt} value={toValue(opt)}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow id="who_can_tag_me" label="Who can tag me in photos/videos?" helperText="Control photo and video tags">
                <Select value={settings.who_can_tag_me} onValueChange={(v) => handleSelectChange('who_can_tag_me', v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover pointer-events-auto">
                    {privacyOptions.posts.map(opt => (
                      <SelectItem key={opt} value={toValue(opt)}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow id="review_tags_before_appear" label="Review tags before they appear" helperText="Approve tags before showing on your profile">
                <Switch
                  checked={settings.review_tags_before_appear}
                  onCheckedChange={(checked) => handleSwitchChange('review_tags_before_appear', checked)}
                />
              </SettingRow>

              <SettingRow id="review_tagged_posts" label="Review posts you're tagged in" helperText="Approve posts before they appear on your timeline">
                <Switch
                  checked={settings.review_tagged_posts}
                  onCheckedChange={(checked) => handleSwitchChange('review_tagged_posts', checked)}
                />
              </SettingRow>
            </div>
          </div>

          {/* Messages & Presence */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              <h3 className="text-xl font-semibold text-gray-800">Messages & Presence</h3>
            </div>
            
            <div className="space-y-4">
              <SettingRow id="message_request_filter" label="Message request filter" helperText="Filter messages from unknown people">
                <Select value={settings.message_request_filter} onValueChange={(v) => handleSelectChange('message_request_filter', v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover pointer-events-auto">
                    {privacyOptions.messageFilter.map(opt => (
                      <SelectItem key={opt} value={toValue(opt)}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow id="allow_read_receipts" label="Allow read receipts" helperText="Let others see when you've read their messages">
                <Switch
                  checked={settings.allow_read_receipts}
                  onCheckedChange={(checked) => handleSwitchChange('allow_read_receipts', checked)}
                />
              </SettingRow>

              <SettingRow id="show_typing_indicators" label="Show typing indicators" helperText="Show when you're typing">
                <Switch
                  checked={settings.show_typing_indicators}
                  onCheckedChange={(checked) => handleSwitchChange('show_typing_indicators', checked)}
                />
              </SettingRow>

              <SettingRow id="show_active_status" label="Show 'Active now / Last seen'" helperText="Let others see when you're active">
                <Switch
                  checked={settings.show_active_status}
                  onCheckedChange={(checked) => handleSwitchChange('show_active_status', checked)}
                />
              </SettingRow>
            </div>
          </div>

          {/* Profile Field Visibility */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
              <Shield className="h-5 w-5 text-red-500" />
              <h3 className="text-xl font-semibold text-gray-800">Profile Field Visibility</h3>
            </div>
            
            <div className="space-y-4">
              <SettingRow id="email_visibility" label="Email visibility" helperText="Control who can see your email">
                <Select value={settings.email_visibility} onValueChange={(v) => handleSelectChange('email_visibility', v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover pointer-events-auto">
                    {privacyOptions.visibility.map(opt => (
                      <SelectItem key={opt} value={toValue(opt)}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow id="phone_visibility" label="Phone number visibility" helperText="Control who can see your phone">
                <Select value={settings.phone_visibility} onValueChange={(v) => handleSelectChange('phone_visibility', v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover pointer-events-auto">
                    {privacyOptions.visibility.map(opt => (
                      <SelectItem key={opt} value={toValue(opt)}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow id="birthday_detail" label="Birthday detail" helperText="Control what birthday info is shown">
                <Select value={settings.birthday_detail} onValueChange={(v) => handleSelectChange('birthday_detail', v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover pointer-events-auto">
                    {privacyOptions.birthdayDetail.map(opt => (
                      <SelectItem key={opt} value={toValue(opt)}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow id="location_visibility" label="Location visibility" helperText="Control who can see your location">
                <Select value={settings.location_visibility} onValueChange={(v) => handleSelectChange('location_visibility', v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover pointer-events-auto">
                    {privacyOptions.visibility.map(opt => (
                      <SelectItem key={opt} value={toValue(opt)}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow id="work_education_visibility" label="Work/Education visibility" helperText="Control who can see work and education info">
                <Select value={settings.work_education_visibility} onValueChange={(v) => handleSelectChange('work_education_visibility', v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover pointer-events-auto">
                    {privacyOptions.visibility.map(opt => (
                      <SelectItem key={opt} value={toValue(opt)}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Communication Settings */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
              Communication Settings
            </h3>
            
            <div className="space-y-4">
              {communicationSettings.map((setting) => (
                <SettingRow key={setting.id} id={setting.id} label={setting.label} helperText="Control who can interact with you">
                  <Select value={settings[setting.id]} onValueChange={(value) => handleSelectChange(setting.id, value)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover pointer-events-auto">
                      {setting.options.map(option => (
                        <SelectItem key={option} value={toValue(option)}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>
              ))}
            </div>
          </div>

          {/* Activity Preferences */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
              Activity Preferences
            </h3>
            
            <div className="space-y-4">
              {activitySettings.map((setting) => (
                <SettingRow key={setting.id} id={setting.id} label={setting.label} helperText="Control activity visibility">
                  <Switch
                    id={setting.id}
                    checked={settings[setting.id] === 'yes'}
                    onCheckedChange={(checked) => handleSwitchChange(setting.id, checked)}
                  />
                </SettingRow>
              ))}
            </div>
          </div>

          {/* Followers & Friend Requests */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
              <Users className="h-5 w-5 text-indigo-500" />
              <h3 className="text-xl font-semibold text-gray-800">Followers & Requests</h3>
            </div>
            
            <div className="space-y-4">
              <SettingRow id="who_can_send_friend_requests" label="Who can send me friend requests?" helperText="Control who can send requests">
                <Select value={settings.who_can_send_friend_requests} onValueChange={(v) => handleSelectChange('who_can_send_friend_requests', v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover pointer-events-auto">
                    {privacyOptions.requests.map(opt => (
                      <SelectItem key={opt} value={toValue(opt)}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow id="approve_new_followers" label="Approve new followers" helperText="Manually approve each follower">
                <Switch
                  checked={settings.approve_new_followers}
                  onCheckedChange={(checked) => handleSwitchChange('approve_new_followers', checked)}
                />
              </SettingRow>

              <SettingRow id="auto_approve_follow_requests" label="Auto-approve requests from people I follow" helperText="Skip approval for mutual follows">
                <Switch
                  checked={settings.auto_approve_follow_requests}
                  onCheckedChange={(checked) => handleSwitchChange('auto_approve_follow_requests', checked)}
                />
              </SettingRow>
            </div>
          </div>

          {/* Discovery & Recommendations */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
              <Search className="h-5 w-5 text-orange-500" />
              <h3 className="text-xl font-semibold text-gray-800">Discovery & Recommendations</h3>
            </div>
            
            <div className="space-y-4">
              <SettingRow id="allow_find_by_email" label="Allow others to find me by email" helperText="Let people discover your profile via email">
                <Switch
                  checked={settings.allow_find_by_email}
                  onCheckedChange={(checked) => handleSwitchChange('allow_find_by_email', checked)}
                />
              </SettingRow>

              <SettingRow id="allow_find_by_phone" label="Allow others to find me by phone" helperText="Let people discover your profile via phone">
                <Switch
                  checked={settings.allow_find_by_phone}
                  onCheckedChange={(checked) => handleSwitchChange('allow_find_by_phone', checked)}
                />
              </SettingRow>

              <SettingRow id="show_in_people_you_may_know" label="Show in 'People You May Know'" helperText="Appear in friend suggestions">
                <Switch
                  checked={settings.show_in_people_you_may_know}
                  onCheckedChange={(checked) => handleSwitchChange('show_in_people_you_may_know', checked)}
                />
              </SettingRow>

              <SettingRow id="personalize_recommendations" label="Personalize recommendations" helperText="Use your activity to improve suggestions">
                <Switch
                  checked={settings.personalize_recommendations}
                  onCheckedChange={(checked) => handleSwitchChange('personalize_recommendations', checked)}
                />
              </SettingRow>
            </div>
          </div>

          {/* Location & Search */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
              Location & Search Settings
            </h3>
            
            <div className="space-y-4">
              {locationAndIndexingSettings.map((setting) => (
                <SettingRow key={setting.id} id={setting.id} label={setting.label} helperText="Control location and search visibility">
                  <Switch
                    id={setting.id}
                    checked={settings[setting.id] === 'yes'}
                    onCheckedChange={(checked) => handleSwitchChange(setting.id, checked)}
                  />
                </SettingRow>
              ))}
            </div>
          </div>

          {/* Stories & Reels */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
              <FileText className="h-5 w-5 text-pink-500" />
              <h3 className="text-xl font-semibold text-gray-800">Stories & Reels</h3>
            </div>
            
            <div className="space-y-4">
              <SettingRow id="who_can_view_stories" label="Who can view my stories?" helperText="Control story audience">
                <Select value={settings.who_can_view_stories} onValueChange={(v) => handleSelectChange('who_can_view_stories', v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover pointer-events-auto">
                    {privacyOptions.stories.map(opt => (
                      <SelectItem key={opt} value={toValue(opt)}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow id="allow_story_replies" label="Allow replies to my stories" helperText="Let people respond to your stories">
                <Select value={settings.allow_story_replies} onValueChange={(v) => handleSelectChange('allow_story_replies', v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover pointer-events-auto">
                    {privacyOptions.storyReplies.map(opt => (
                      <SelectItem key={opt} value={toValue(opt)}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow id="allow_story_sharing" label="Allow sharing of my stories" helperText="Let others share your stories">
                <Switch
                  checked={settings.allow_story_sharing}
                  onCheckedChange={(checked) => handleSwitchChange('allow_story_sharing', checked)}
                />
              </SettingRow>
            </div>
          </div>

          {/* Safety & Filtering */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <h3 className="text-xl font-semibold text-gray-800">Safety & Filtering</h3>
            </div>
            
            <div className="space-y-4">
              <SettingRow id="sensitive_content_filter" label="Sensitive content filter" helperText="Filter potentially sensitive content">
                <Select value={settings.sensitive_content_filter} onValueChange={(v) => handleSelectChange('sensitive_content_filter', v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover pointer-events-auto">
                    {privacyOptions.contentFilter.map(opt => (
                      <SelectItem key={opt} value={toValue(opt)}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>
            </div>
          </div>

          {/* Data & Security */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
              <Settings className="h-5 w-5 text-gray-500" />
              <h3 className="text-xl font-semibold text-gray-800">Data & Security</h3>
            </div>
            
            <div className="space-y-4">
              <SettingRow id="login_alerts_new_device" label="Login alerts (new device)" helperText="Get notified when logging in from a new device">
                <Switch
                  checked={settings.login_alerts_new_device}
                  onCheckedChange={(checked) => handleSwitchChange('login_alerts_new_device', checked)}
                />
              </SettingRow>
            </div>
          </div>

          {/* Ads & Personalization */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
              <Megaphone className="h-5 w-5 text-teal-500" />
              <h3 className="text-xl font-semibold text-gray-800">Ads & Personalization</h3>
            </div>
            
            <div className="space-y-4">
              <SettingRow id="personalized_ads_activity" label="Personalized ads from activity" helperText="See ads based on your SHQIPET activity">
                <Switch
                  checked={settings.personalized_ads_activity}
                  onCheckedChange={(checked) => handleSwitchChange('personalized_ads_activity', checked)}
                />
              </SettingRow>

              <SettingRow id="ads_based_on_partners_data" label="Ads based on partners' data" helperText="See ads based on data from our partners">
                <Switch
                  checked={settings.ads_based_on_partners_data}
                  onCheckedChange={(checked) => handleSwitchChange('ads_based_on_partners_data', checked)}
                />
              </SettingRow>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Privacy Settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all privacy settings to recommended defaults. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetToDefaults();
                setShowResetDialog(false);
              }}
            >
              Reset to Defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PrivacySettingsForm;
