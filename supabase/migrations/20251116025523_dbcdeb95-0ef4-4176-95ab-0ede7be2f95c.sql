-- Update bump_tabs_count to clamp at 0 instead of 1
CREATE OR REPLACE FUNCTION public.bump_tabs_count(
  p_device_stable_id text,
  p_delta integer,
  p_device jsonb DEFAULT '{}'::jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_new_count integer;
  v_device_id text := COALESCE(p_device->>'deviceId', NULL);
  v_screen_resolution text := COALESCE(p_device->>'screenResolution', NULL);
  v_device_type text := COALESCE(p_device->>'detectedDeviceType', p_device->>'deviceType', NULL);
  v_operating_system text := COALESCE(p_device->>'operatingSystem', NULL);
  v_browser_name text := COALESCE(p_device->>'browserName', NULL);
  v_browser_version text := COALESCE(p_device->>'browserVersion', NULL);
  v_platform text := COALESCE(p_device->>'platform', NULL);
  v_user_agent text := COALESCE(p_device->>'userAgent', NULL);
  v_city text := COALESCE(p_device->>'city', NULL);
  v_country text := COALESCE(p_device->>'country', NULL);
  v_country_code text := COALESCE(p_device->>'country_code', NULL);
  v_region text := COALESCE(p_device->>'region', NULL);
  v_lat double precision := NULL;
  v_lon double precision := NULL;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  BEGIN
    v_lat := (p_device->>'latitude')::double precision;
    v_lon := (p_device->>'longitude')::double precision;
  EXCEPTION WHEN others THEN
    v_lat := NULL; v_lon := NULL;
  END;

  INSERT INTO public.user_sessions (
    user_id, device_id, device_stable_id, device_type, operating_system,
    browser_name, browser_version, screen_resolution, platform, user_agent,
    is_current_device, is_trusted, active_tabs_count,
    city, country, country_code, region, latitude, longitude
  )
  VALUES (
    v_user_id, v_device_id, lower(p_device_stable_id), COALESCE(v_device_type, 'laptop'), v_operating_system,
    v_browser_name, v_browser_version, v_screen_resolution, v_platform, v_user_agent,
    true, false, 1,
    v_city, v_country, v_country_code, v_region, v_lat, v_lon
  )
  ON CONFLICT (user_id, device_stable_id)
  DO UPDATE SET
    active_tabs_count = GREATEST(public.user_sessions.active_tabs_count + p_delta, 0),
    is_current_device = true,
    device_id = COALESCE(EXCLUDED.device_id, public.user_sessions.device_id),
    device_type = COALESCE(EXCLUDED.device_type, public.user_sessions.device_type),
    operating_system = COALESCE(EXCLUDED.operating_system, public.user_sessions.operating_system),
    browser_name = COALESCE(EXCLUDED.browser_name, public.user_sessions.browser_name),
    browser_version = COALESCE(EXCLUDED.browser_version, public.user_sessions.browser_version),
    screen_resolution = COALESCE(EXCLUDED.screen_resolution, public.user_sessions.screen_resolution),
    platform = COALESCE(EXCLUDED.platform, public.user_sessions.platform),
    user_agent = COALESCE(EXCLUDED.user_agent, public.user_sessions.user_agent),
    city = COALESCE(EXCLUDED.city, public.user_sessions.city),
    country = COALESCE(EXCLUDED.country, public.user_sessions.country),
    country_code = COALESCE(EXCLUDED.country_code, public.user_sessions.country_code),
    region = COALESCE(EXCLUDED.region, public.user_sessions.region),
    latitude = COALESCE(EXCLUDED.latitude, public.user_sessions.latitude),
    longitude = COALESCE(EXCLUDED.longitude, public.user_sessions.longitude),
    updated_at = now();

  SELECT active_tabs_count INTO v_new_count
  FROM public.user_sessions
  WHERE user_id = v_user_id AND device_stable_id = lower(p_device_stable_id);

  UPDATE public.user_sessions
    SET is_current_device = false
    WHERE user_id = v_user_id
      AND device_stable_id <> lower(p_device_stable_id);

  RETURN v_new_count;
END;
$function$;