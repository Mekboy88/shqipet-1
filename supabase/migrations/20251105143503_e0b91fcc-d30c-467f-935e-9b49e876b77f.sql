-- Create function to get public website settings
CREATE OR REPLACE FUNCTION public.get_public_website_settings()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  settings_data jsonb;
  favicon_setting record;
BEGIN
  -- Get favicon from app_settings if it exists
  SELECT value INTO favicon_setting
  FROM public.app_settings
  WHERE key = 'favicon_url'
  LIMIT 1;
  
  -- Build settings object
  settings_data := jsonb_build_object(
    'favicon_url', COALESCE(favicon_setting.value, '"/favicon.png"'::jsonb),
    'developer_mode', false,
    'maintenance_countdown_enabled', false,
    'maintenance_return_time', 2,
    'maintenance_super_admin_bypass', false,
    'maintenance_production_only', false
  );
  
  RETURN settings_data;
END;
$$;