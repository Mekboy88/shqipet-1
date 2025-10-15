-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Direct Messages & Chat
  notify_new_message BOOLEAN DEFAULT true,
  notify_message_request BOOLEAN DEFAULT true,
  notify_message_reaction BOOLEAN DEFAULT true,
  notify_unread_reminder BOOLEAN DEFAULT false,
  notify_missed_call BOOLEAN DEFAULT true,
  
  -- Posts, Comments & Reactions
  notify_comment_reply BOOLEAN DEFAULT true,
  notify_reply_to_reply BOOLEAN DEFAULT true,
  notify_post_reaction BOOLEAN DEFAULT true,
  notify_comment_reaction BOOLEAN DEFAULT true,
  notify_post_saved BOOLEAN DEFAULT false,
  notify_post_reported BOOLEAN DEFAULT true,
  notify_post_moderation BOOLEAN DEFAULT true,
  notify_quote_repost BOOLEAN DEFAULT true,
  notify_poll_vote BOOLEAN DEFAULT true,
  notify_qa_question BOOLEAN DEFAULT true,
  
  -- Mentions, Tags & Media
  notify_comment_mention BOOLEAN DEFAULT true,
  notify_photo_tag BOOLEAN DEFAULT true,
  notify_tag_review BOOLEAN DEFAULT true,
  notify_tag_removed BOOLEAN DEFAULT false,
  notify_story_mention BOOLEAN DEFAULT true,
  
  -- Friends & Follows
  notify_friend_request BOOLEAN DEFAULT true,
  notify_friend_accepted BOOLEAN DEFAULT true,
  notify_follow_request BOOLEAN DEFAULT true,
  notify_new_follower BOOLEAN DEFAULT true,
  notify_unfollow BOOLEAN DEFAULT false,
  notify_suggested_friends BOOLEAN DEFAULT false,
  
  -- Pages (as owner/admin)
  notify_page_follower BOOLEAN DEFAULT true,
  notify_page_review BOOLEAN DEFAULT true,
  notify_page_comment BOOLEAN DEFAULT true,
  notify_page_message BOOLEAN DEFAULT true,
  notify_page_mention BOOLEAN DEFAULT true,
  notify_page_role_changed BOOLEAN DEFAULT true,
  notify_page_share BOOLEAN DEFAULT true,
  
  -- Groups & Communities
  notify_group_invite BOOLEAN DEFAULT true,
  notify_group_join_request BOOLEAN DEFAULT true,
  notify_group_request_approved BOOLEAN DEFAULT true,
  notify_group_post_approval BOOLEAN DEFAULT true,
  notify_group_post_status BOOLEAN DEFAULT true,
  notify_group_comment BOOLEAN DEFAULT true,
  notify_group_event BOOLEAN DEFAULT true,
  
  -- Events & Live
  notify_event_invite BOOLEAN DEFAULT true,
  notify_event_reminder BOOLEAN DEFAULT true,
  notify_event_rsvp_update BOOLEAN DEFAULT true,
  notify_event_comment BOOLEAN DEFAULT true,
  notify_event_role_change BOOLEAN DEFAULT true,
  notify_live_started BOOLEAN DEFAULT true,
  notify_live_comment BOOLEAN DEFAULT false,
  
  -- Stories, Reels & Video
  notify_story_view_milestone BOOLEAN DEFAULT false,
  notify_story_reply BOOLEAN DEFAULT true,
  notify_story_tag BOOLEAN DEFAULT true,
  notify_reel_comment BOOLEAN DEFAULT true,
  notify_reel_remix BOOLEAN DEFAULT true,
  
  -- Timeline & Profile
  notify_timeline_post BOOLEAN DEFAULT true,
  notify_profile_reaction BOOLEAN DEFAULT true,
  notify_birthday_reminder BOOLEAN DEFAULT true,
  notify_memory_highlight BOOLEAN DEFAULT true,
  
  -- Marketplace & Commerce
  notify_marketplace_offer BOOLEAN DEFAULT true,
  notify_marketplace_message BOOLEAN DEFAULT true,
  notify_item_sold BOOLEAN DEFAULT true,
  notify_payment_received BOOLEAN DEFAULT true,
  notify_shipping_update BOOLEAN DEFAULT true,
  notify_dispute BOOLEAN DEFAULT true,
  notify_price_drop BOOLEAN DEFAULT false,
  
  -- Monetization & Creator
  notify_monetization_eligibility BOOLEAN DEFAULT true,
  notify_earnings_summary BOOLEAN DEFAULT true,
  notify_payout BOOLEAN DEFAULT true,
  notify_policy_violation BOOLEAN DEFAULT true,
  notify_branded_content BOOLEAN DEFAULT true,
  
  -- Security & Account
  notify_new_login BOOLEAN DEFAULT true,
  notify_password_changed BOOLEAN DEFAULT true,
  notify_contact_changed BOOLEAN DEFAULT true,
  notify_2fa_changed BOOLEAN DEFAULT true,
  notify_suspicious_activity BOOLEAN DEFAULT true,
  notify_privacy_changed BOOLEAN DEFAULT true,
  
  -- System & Announcements
  notify_service_status BOOLEAN DEFAULT true,
  notify_policy_updates BOOLEAN DEFAULT true,
  notify_product_updates BOOLEAN DEFAULT false,
  notify_surveys BOOLEAN DEFAULT false,
  
  -- Channel Preferences
  channel_push BOOLEAN DEFAULT true,
  channel_email BOOLEAN DEFAULT true,
  channel_sms BOOLEAN DEFAULT false,
  channel_in_app BOOLEAN DEFAULT true,
  
  -- Behavior Settings
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  digest_frequency TEXT DEFAULT 'instant', -- instant, hourly, daily, weekly
  priority_level TEXT DEFAULT 'all', -- all, important
  notification_language TEXT DEFAULT 'en',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all preferences
CREATE POLICY "Admins can view all notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (current_user_is_admin() OR is_platform_owner(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_notification_preferences_user_id 
  ON public.notification_preferences(user_id);