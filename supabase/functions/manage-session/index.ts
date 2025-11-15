import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Universal device type detection based on viewport width
// Rules: mobile < 768px | tablet < 1024px | laptop < 1920px | desktop >= 1920px
function detectDeviceType(screenResolution: string): string {
  const width = parseInt(screenResolution.split('x')[0]);
  
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1920) return 'laptop';
  return 'desktop';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, sessionData, deviceStableId } = await req.json();

    if (action === 'upsert') {
      let locationData: any = {
        latitude: sessionData.latitude,
        longitude: sessionData.longitude,
        city: null,
        country: null,
        country_code: null,
        region: null,
      };

      if (sessionData.latitude && sessionData.longitude) {
        try {
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${sessionData.latitude}&lon=${sessionData.longitude}`,
            { headers: { 'User-Agent': 'DeviceSessionApp/1.0' } }
          );
          
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            locationData = {
              ...locationData,
              city: geoData.address?.city || geoData.address?.town || geoData.address?.village || null,
              country: geoData.address?.country || null,
              country_code: geoData.address?.country_code?.toUpperCase() || null,
              region: geoData.address?.state || geoData.address?.region || null,
            };
          }
        } catch (geoError) {
          console.error('Reverse geocoding failed:', geoError);
        }
      }

      // Detect device type based on screen resolution using universal rules
      const detectedDeviceType = detectDeviceType(sessionData.screenResolution);
      console.log('Device detection:', {
        screenResolution: sessionData.screenResolution,
        detectedType: detectedDeviceType
      });

      const { data, error } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: user.id,
          device_id: sessionData.deviceId,
          device_stable_id: sessionData.deviceStableId,
          device_type: detectedDeviceType,
          operating_system: sessionData.operatingSystem,
          browser_name: sessionData.browserName,
          browser_version: sessionData.browserVersion,
          screen_resolution: sessionData.screenResolution,
          platform: sessionData.platform,
          user_agent: sessionData.userAgent,
          is_current_device: true,
          is_trusted: false,
          ...locationData,
        }, {
          onConflict: 'user_id,device_stable_id',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('user_sessions')
        .update({ is_current_device: false })
        .neq('device_stable_id', sessionData.deviceStableId)
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ success: true, session: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'trust') {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_trusted: true })
        .eq('user_id', user.id)
        .eq('device_stable_id', deviceStableId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'revoke') {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id)
        .eq('device_stable_id', deviceStableId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Session management error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
