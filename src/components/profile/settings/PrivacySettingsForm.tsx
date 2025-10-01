
import React from 'react';
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

interface PrivacySettingsFormProps {
  userInfo: {
    [key: string]: any;
  };
  setUserInfo: React.Dispatch<React.SetStateAction<any>>;
}

const lightFocusStyles = "bg-white border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/10 focus-visible:ring-offset-0";
const redFocusRingStyle = "focus:ring-2 focus:ring-red-500/10 focus-visible:ring-2 focus-visible:ring-red-500/10 focus-visible:ring-offset-0 focus:outline-none";

const PrivacySettingsForm: React.FC<PrivacySettingsFormProps> = ({ userInfo, setUserInfo }) => {
  const handleSelectChange = (field: string, value: string) => {
    setUserInfo((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSwitchChange = (field: string, checked: boolean) => {
    setUserInfo((prev: any) => ({ ...prev, [field]: checked ? 'yes' : 'no' }));
  };

  const handleSave = () => {
    console.log('Saving privacy settings:', userInfo);
    // Here you would typically make an API call to save the settings
  };

  const privacyOptions = {
    follow: ['Everyone', 'People I Follow'],
    message: ['Everyone', 'People I Follow'],
    friends: ['Everyone', 'People I Follow', 'No body'],
    timeline: ['Everyone', 'People I Follow', 'No body'],
    birthday: ['Everyone', 'People I Follow', 'No body'],
    status: ['Online', 'Offline'],
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

  const toValue = (option: string) => option.toLowerCase().replace(/ /g, '_');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Visibility Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
              Profile Visibility
            </h3>
            
            <div className="space-y-6">
              {profileVisibilitySettings.map((setting) => (
                <div key={setting.id} className="mb-6">
                  <Label htmlFor={setting.id} className="text-sm font-medium text-gray-700 mb-2 block">
                    {setting.label}
                  </Label>
                  <Select
                    value={userInfo[setting.id]}
                    onValueChange={(value) => handleSelectChange(setting.id, value)}
                  >
                    <SelectTrigger className="w-full transition-all duration-200 hover:shadow-md focus:shadow-lg">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-lg border border-gray-200">
                      {setting.options.map(option => (
                        <SelectItem key={option} value={toValue(option)}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Preferences Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
              Activity Preferences
            </h3>
            
            <div className="space-y-4">
              {activitySettings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between py-2">
                  <Label htmlFor={setting.id} className="text-sm font-medium text-gray-700">
                    {setting.label}
                  </Label>
                  <Switch
                    id={setting.id}
                    checked={userInfo[setting.id] === 'yes'}
                    onCheckedChange={(checked) => handleSwitchChange(setting.id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Communication Settings Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
              Communication Settings
            </h3>
            
            <div className="space-y-6">
              {communicationSettings.map((setting) => (
                <div key={setting.id} className="mb-6">
                  <Label htmlFor={setting.id} className="text-sm font-medium text-gray-700 mb-2 block">
                    {setting.label}
                  </Label>
                  <Select
                    value={userInfo[setting.id]}
                    onValueChange={(value) => handleSelectChange(setting.id, value)}
                  >
                    <SelectTrigger className="w-full transition-all duration-200 hover:shadow-md focus:shadow-lg">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-lg border border-gray-200">
                      {setting.options.map(option => (
                        <SelectItem key={option} value={toValue(option)}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Location & Search Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
              Location & Search Settings
            </h3>
            
            <div className="space-y-4">
              {locationAndIndexingSettings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between py-2">
                  <Label htmlFor={setting.id} className="text-sm font-medium text-gray-700">
                    {setting.label}
                  </Label>
                  <Switch
                    id={setting.id}
                    checked={userInfo[setting.id] === 'yes'}
                    onCheckedChange={(checked) => handleSwitchChange(setting.id, checked)}
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

export default PrivacySettingsForm;
