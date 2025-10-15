-- Add missing notification preference field for profile visits
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS notify_profile_visit BOOLEAN DEFAULT false;

-- Add clearer aliases/columns for the basic social interactions if they don't exist
-- These match the original notification settings more directly

-- Update comment: Ensure we have clear fields for the basic social notifications
-- notify_post_reaction = Someone likes my post
-- notify_comment_reply = Someone comments on my post  
-- notify_quote_repost = Someone shares my post
-- notify_new_follower = Someone follows me
-- notify_comment_mention = Someone mentions me
-- notify_page_follower = Someone likes my page (for pages you own)
-- notify_profile_visit = Someone visits my profile (NEW)
-- notify_group_join_request = Someone joins my group (for groups you own)
-- notify_friend_accepted = Friend request accepted
-- notify_timeline_post = Someone posts on my timeline
-- notify_memory_highlight = Memory reminders