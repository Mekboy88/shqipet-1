-- Create comprehensive user_privacy_settings table with real-time support
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Existing fields (Profile Visibility)
  privacy_who_can_follow_me TEXT DEFAULT 'everyone',
  privacy_who_can_see_my_friends TEXT DEFAULT 'people_i_follow',
  privacy_who_can_see_my_birthday TEXT DEFAULT 'people_i_follow',
  privacy_status TEXT DEFAULT 'online',
  
  -- Existing fields (Communication)
  privacy_who_can_message_me TEXT DEFAULT 'people_i_follow',
  privacy_who_can_post_on_my_timeline TEXT DEFAULT 'no_body',
  
  -- Existing fields (Activity)
  privacy_confirm_request_when_someone_follows_you TEXT DEFAULT 'yes',
  privacy_show_my_activities TEXT DEFAULT 'no',
  
  -- Existing fields (Location & Search)
  privacy_share_my_location_with_public TEXT DEFAULT 'no',
  privacy_allow_search_engines_to_index TEXT DEFAULT 'no',
  
  -- A. Timeline, Tagging & Mentions
  who_can_comment_on_posts TEXT DEFAULT 'followers',
  who_can_share_posts TEXT DEFAULT 'followers',
  who_can_mention_me TEXT DEFAULT 'everyone',
  who_can_tag_me TEXT DEFAULT 'people_i_follow',
  review_tags_before_appear BOOLEAN DEFAULT true,
  review_tagged_posts BOOLEAN DEFAULT true,
  
  -- B. Messages & Presence
  message_request_filter TEXT DEFAULT 'standard',
  allow_read_receipts BOOLEAN DEFAULT false,
  show_typing_indicators BOOLEAN DEFAULT false,
  show_active_status BOOLEAN DEFAULT false,
  
  -- C. Followers & Friend Requests
  who_can_send_friend_requests TEXT DEFAULT 'everyone',
  approve_new_followers BOOLEAN DEFAULT false,
  auto_approve_follow_requests BOOLEAN DEFAULT false,
  
  -- D. Profile Field Visibility
  email_visibility TEXT DEFAULT 'only_me',
  phone_visibility TEXT DEFAULT 'only_me',
  birthday_detail TEXT DEFAULT 'day_month_only',
  location_visibility TEXT DEFAULT 'only_me',
  work_education_visibility TEXT DEFAULT 'people_i_follow',
  
  -- E. Discovery & Recommendations
  allow_find_by_email BOOLEAN DEFAULT false,
  allow_find_by_phone BOOLEAN DEFAULT false,
  show_in_people_you_may_know BOOLEAN DEFAULT true,
  personalize_recommendations BOOLEAN DEFAULT true,
  
  -- F. Stories & Reels
  who_can_view_stories TEXT DEFAULT 'followers',
  allow_story_replies TEXT DEFAULT 'followers',
  allow_story_sharing BOOLEAN DEFAULT true,
  
  -- G. Safety & Filtering
  restricted_list JSONB DEFAULT '[]'::jsonb,
  muted_accounts JSONB DEFAULT '[]'::jsonb,
  hidden_words JSONB DEFAULT '[]'::jsonb,
  sensitive_content_filter TEXT DEFAULT 'standard',
  
  -- H. Data & Security
  login_alerts_new_device BOOLEAN DEFAULT true,
  
  -- I. Ads & Personalization
  personalized_ads_activity BOOLEAN DEFAULT true,
  ads_based_on_partners_data BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own privacy settings"
  ON public.user_privacy_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings"
  ON public.user_privacy_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings"
  ON public.user_privacy_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own privacy settings"
  ON public.user_privacy_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all privacy settings
CREATE POLICY "Admins can view all privacy settings"
  ON public.user_privacy_settings
  FOR SELECT
  USING (current_user_is_admin() OR is_platform_owner(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER set_updated_at_privacy_settings
  BEFORE UPDATE ON public.user_privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_privacy_settings;

-- Create indexes for performance
CREATE INDEX idx_user_privacy_settings_user_id ON public.user_privacy_settings(user_id);
CREATE INDEX idx_user_privacy_settings_updated_at ON public.user_privacy_settings(updated_at DESC);