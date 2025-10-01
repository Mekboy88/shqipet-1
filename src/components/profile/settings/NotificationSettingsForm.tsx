
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ProfileSettingsData } from '@/hooks/useProfileSettings';

interface NotificationSettingsFormProps {
  userInfo: ProfileSettingsData;
  setUserInfo: React.Dispatch<React.SetStateAction<ProfileSettingsData>>;
  onSave?: (data: Partial<ProfileSettingsData>) => Promise<boolean>;
  saving?: boolean;
}

const NotificationSettingsForm: React.FC<NotificationSettingsFormProps> = ({ 
  userInfo, 
  setUserInfo, 
  onSave,
  saving = false 
}) => {
  const handleSave = async () => {
    if (onSave) {
      await onSave({
        notify_on_like: userInfo.notify_on_like,
        notify_on_comment: userInfo.notify_on_comment,
        notify_on_share: userInfo.notify_on_share,
        notify_on_follow: userInfo.notify_on_follow,
        notify_on_page_like: userInfo.notify_on_page_like,
        notify_on_profile_visit: userInfo.notify_on_profile_visit,
        notify_on_mention: userInfo.notify_on_mention,
        notify_on_group_join: userInfo.notify_on_group_join,
        notify_on_friend_request_accept: userInfo.notify_on_friend_request_accept,
        notify_on_timeline_post: userInfo.notify_on_timeline_post,
        notify_on_remembrance: userInfo.notify_on_remembrance
      });
    }
  };

  const handleSwitchChange = (field: keyof ProfileSettingsData, value: boolean) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const socialNotifications = [
    { key: 'notify_on_like', label: 'Someone likes my post' },
    { key: 'notify_on_comment', label: 'Someone comments on my post' },
    { key: 'notify_on_share', label: 'Someone shares my post' },
    { key: 'notify_on_follow', label: 'Someone follows me' },
    { key: 'notify_on_mention', label: 'Someone mentions me' }
  ];

  const activityNotifications = [
    { key: 'notify_on_page_like', label: 'Someone likes my page' },
    { key: 'notify_on_profile_visit', label: 'Someone visits my profile' },
    { key: 'notify_on_group_join', label: 'Someone joins my group' },
    { key: 'notify_on_friend_request_accept', label: 'Friend request accepted' },
    { key: 'notify_on_timeline_post', label: 'Someone posts on my timeline' },
    { key: 'notify_on_remembrance', label: 'Memory reminders' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Social Interactions Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
              Social Interactions
            </h3>
            
            <div className="space-y-4">
              {socialNotifications.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between py-2">
                  <Label htmlFor={setting.key} className="text-sm font-medium text-gray-700">
                    {setting.label}
                  </Label>
                  <Switch
                    id={setting.key}
                    checked={userInfo[setting.key as keyof ProfileSettingsData] as boolean || false}
                    onCheckedChange={(checked) => handleSwitchChange(setting.key as keyof ProfileSettingsData, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Activity & Updates Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
              Activity & Updates
            </h3>
            
            <div className="space-y-4">
              {activityNotifications.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between py-2">
                  <Label htmlFor={setting.key} className="text-sm font-medium text-gray-700">
                    {setting.label}
                  </Label>
                  <Switch
                    id={setting.key}
                    checked={userInfo[setting.key as keyof ProfileSettingsData] as boolean || false}
                    onCheckedChange={(checked) => handleSwitchChange(setting.key as keyof ProfileSettingsData, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsForm;
