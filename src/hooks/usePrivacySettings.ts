import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PrivacySettings {
  // Existing fields
  privacy_who_can_follow_me?: string;
  privacy_who_can_see_my_friends?: string;
  privacy_who_can_see_my_birthday?: string;
  privacy_status?: string;
  privacy_who_can_message_me?: string;
  privacy_who_can_post_on_my_timeline?: string;
  privacy_confirm_request_when_someone_follows_you?: string;
  privacy_show_my_activities?: string;
  privacy_share_my_location_with_public?: string;
  privacy_allow_search_engines_to_index?: string;
  
  // Timeline, Tagging & Mentions
  who_can_comment_on_posts?: string;
  who_can_share_posts?: string;
  who_can_mention_me?: string;
  who_can_tag_me?: string;
  review_tags_before_appear?: boolean;
  review_tagged_posts?: boolean;
  
  // Messages & Presence
  message_request_filter?: string;
  allow_read_receipts?: boolean;
  show_typing_indicators?: boolean;
  show_active_status?: boolean;
  
  // Followers & Friend Requests
  who_can_send_friend_requests?: string;
  approve_new_followers?: boolean;
  auto_approve_follow_requests?: boolean;
  
  // Profile Field Visibility
  email_visibility?: string;
  phone_visibility?: string;
  birthday_detail?: string;
  location_visibility?: string;
  work_education_visibility?: string;
  
  // Discovery & Recommendations
  allow_find_by_email?: boolean;
  allow_find_by_phone?: boolean;
  show_in_people_you_may_know?: boolean;
  personalize_recommendations?: boolean;
  
  // Stories & Reels
  who_can_view_stories?: string;
  allow_story_replies?: string;
  allow_story_sharing?: boolean;
  
  // Safety & Filtering
  restricted_list?: any[];
  muted_accounts?: any[];
  hidden_words?: any[];
  sensitive_content_filter?: string;
  
  // Data & Security
  login_alerts_new_device?: boolean;
  
  // Ads & Personalization
  personalized_ads_activity?: boolean;
  ads_based_on_partners_data?: boolean;
  
  [key: string]: any;
}

export const usePrivacySettings = () => {
  const [settings, setSettings] = useState<PrivacySettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastLocalWriteAtRef = useRef<number>(0);
  const isInitialLoadRef = useRef(true);

  // Load settings from database
  const loadSettings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading privacy settings:', error);
        toast.error('Failed to load privacy settings');
        return;
      }

      if (data) {
        setSettings(data);
      } else {
        // Insert default settings for new user
        const { data: newSettings, error: insertError } = await supabase
          .from('user_privacy_settings')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default privacy settings:', insertError);
        } else if (newSettings) {
          setSettings(newSettings);
        }
      }
    } catch (error) {
      console.error('Error in loadSettings:', error);
    } finally {
      setLoading(false);
      isInitialLoadRef.current = false;
    }
  }, []);

  // Debounced save function
  const saveSettings = useCallback(async (updatedSettings: Partial<PrivacySettings>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      lastLocalWriteAtRef.current = Date.now();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from('user_privacy_settings')
          .update(updatedSettings)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error saving privacy settings:', error);
          toast.error('Failed to save privacy settings');
        } else {
          toast.success('Privacy settings updated');
        }
      } catch (error) {
        console.error('Error in saveSettings:', error);
        toast.error('Failed to save privacy settings');
      } finally {
        setTimeout(() => setSaving(false), 300);
      }
    }, 600);
  }, []);

  // Update settings (optimistic + debounced save)
  const updateSettings = useCallback((updates: Partial<PrivacySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    saveSettings(updates);
  }, [saveSettings]);

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    const defaults: Partial<PrivacySettings> = {
      // Privacy-first defaults
      privacy_who_can_follow_me: 'everyone',
      privacy_who_can_see_my_friends: 'people_i_follow',
      privacy_who_can_see_my_birthday: 'people_i_follow',
      privacy_status: 'online',
      privacy_who_can_message_me: 'people_i_follow',
      privacy_who_can_post_on_my_timeline: 'no_body',
      privacy_confirm_request_when_someone_follows_you: 'yes',
      privacy_show_my_activities: 'no',
      privacy_share_my_location_with_public: 'no',
      privacy_allow_search_engines_to_index: 'no',
      who_can_comment_on_posts: 'followers',
      who_can_share_posts: 'followers',
      who_can_mention_me: 'everyone',
      who_can_tag_me: 'people_i_follow',
      review_tags_before_appear: true,
      review_tagged_posts: true,
      message_request_filter: 'standard',
      allow_read_receipts: false,
      show_typing_indicators: false,
      show_active_status: false,
      who_can_send_friend_requests: 'everyone',
      approve_new_followers: false,
      auto_approve_follow_requests: false,
      email_visibility: 'only_me',
      phone_visibility: 'only_me',
      birthday_detail: 'day_month_only',
      location_visibility: 'only_me',
      work_education_visibility: 'people_i_follow',
      allow_find_by_email: false,
      allow_find_by_phone: false,
      show_in_people_you_may_know: true,
      personalize_recommendations: true,
      who_can_view_stories: 'followers',
      allow_story_replies: 'followers',
      allow_story_sharing: true,
      sensitive_content_filter: 'standard',
      login_alerts_new_device: true,
      personalized_ads_activity: true,
      ads_based_on_partners_data: false,
    };

    setSettings(prev => ({ ...prev, ...defaults }));
    await saveSettings(defaults);
    toast.success('Settings reset to defaults');
  }, [saveSettings]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Real-time subscription
  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('privacy_settings_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_privacy_settings',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Skip initial load updates
            if (isInitialLoadRef.current) return;
            
            // Skip if this is our own recent update
            const now = Date.now();
            if (now - lastLocalWriteAtRef.current < 2000) return;
            
            // Update settings from remote
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              setSettings(payload.new as PrivacySettings);
            }
          }
        )
        .subscribe();

      return channel;
    };

    let channel: any;
    setupRealtime().then(ch => { channel = ch; });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return {
    settings,
    loading,
    saving,
    updateSettings,
    resetToDefaults,
    loadSettings,
  };
};
