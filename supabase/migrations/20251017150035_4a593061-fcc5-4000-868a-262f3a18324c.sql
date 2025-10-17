-- Enable full replication for user_privacy_settings table to ensure complete row data during updates
ALTER TABLE public.user_privacy_settings REPLICA IDENTITY FULL;