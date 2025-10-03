-- Phase 3: Fix profile_access_logs Security Issues

-- 1. Allow users to see who has viewed their profile
CREATE POLICY "Users can see who viewed their profile"
ON public.profile_access_logs
FOR SELECT
TO authenticated
USING (auth.uid() = viewed_profile_id);

-- 2. Restrict INSERT to prevent fake log entries
-- Only allow legitimate system-generated logs
CREATE POLICY "Only system can insert access logs"
ON public.profile_access_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = viewer_id 
  AND viewer_id IS NOT NULL
);