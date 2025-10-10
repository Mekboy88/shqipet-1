-- Create admin function to get live operation metrics
CREATE OR REPLACE FUNCTION public.admin_get_live_operation_metrics(p_window_minutes int DEFAULT 5)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  window_start timestamptz;
BEGIN
  -- Security: Only admins and platform owners can access
  IF NOT (current_user_is_admin() OR is_platform_owner(auth.uid())) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  window_start := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Aggregate metrics from real tables
  SELECT jsonb_build_object(
    'window_minutes', p_window_minutes,
    'timestamp', now(),
    'metrics', jsonb_build_object(
      'total_profiles', (SELECT COUNT(*) FROM public.profiles),
      'recent_posts', (SELECT COUNT(*) FROM public.posts WHERE created_at >= window_start),
      'recent_notifications', (SELECT COUNT(*) FROM public.notifications WHERE created_at >= window_start),
      'recent_analytics', (SELECT COUNT(*) FROM public.analytics_events WHERE created_at >= window_start),
      'recent_uploads', (SELECT COUNT(*) FROM public.upload_logs WHERE started_at >= window_start),
      'recent_errors', (SELECT COUNT(*) FROM public.security_events WHERE created_at >= window_start AND risk_level IN ('high', 'critical')),
      'active_tables', 8
    ),
    'recent_events', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'type', event_type,
          'description', event_description,
          'risk_level', risk_level,
          'timestamp', created_at
        ) ORDER BY created_at DESC
      ), '[]'::jsonb)
      FROM (
        SELECT event_type, event_description, risk_level, created_at
        FROM public.security_events
        WHERE created_at >= window_start
        ORDER BY created_at DESC
        LIMIT 10
      ) recent
    )
  ) INTO result;
  
  RETURN result;
END;
$$;