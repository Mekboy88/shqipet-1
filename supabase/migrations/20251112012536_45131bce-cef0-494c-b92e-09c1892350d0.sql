-- Fix RLS policies for user_sessions with simpler approach

-- First enable RLS if not already enabled
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users view own session activity" ON user_sessions;
DROP POLICY IF EXISTS "Admins can view all session activity" ON user_sessions;

-- Allow users to view their own sessions
CREATE POLICY "view_own_sessions"
ON user_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = user_sessions.user_id 
    AND profiles.auth_user_id = auth.uid()
  )
);

-- Allow users to insert their own sessions  
CREATE POLICY "insert_own_sessions"
ON user_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = user_sessions.user_id 
    AND profiles.auth_user_id = auth.uid()
  )
);

-- Allow users to update their own sessions
CREATE POLICY "update_own_sessions"
ON user_sessions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = user_sessions.user_id 
    AND profiles.auth_user_id = auth.uid()
  )
);

-- Allow admins to manage all sessions
CREATE POLICY "admin_all_sessions"
ON user_sessions
FOR ALL
TO authenticated
USING (current_user_is_admin() OR is_platform_owner(auth.uid()));