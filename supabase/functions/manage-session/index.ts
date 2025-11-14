import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionData {
  deviceFingerprint: string;
  deviceStableId: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  deviceName?: string;
  operatingSystem?: string;
  osVersion?: string;
  browserName?: string;
  browserVersion?: string;
  userAgent?: string;
  screenResolution?: string;
  platformType?: string;
  latitude?: number;
  longitude?: number;
  sessionToken?: string;
  mfaEnabled?: boolean;
}

interface GeolocationResult {
  city?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace('Bearer ', '').trim();
    if (!jwt) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(jwt);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, sessionData } = await req.json() as { action: string; sessionData?: SessionData };

    console.log(`Processing ${action} for user ${user.id}`);

    // Handle different actions
    switch (action) {
      case 'register': {
        if (!sessionData) {
          return new Response(
            JSON.stringify({ error: 'Session data required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate required fields
        if (!sessionData.deviceFingerprint || !sessionData.deviceStableId) {
          return new Response(
            JSON.stringify({ error: 'Device fingerprint and stable ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get IP address from request
        const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                         req.headers.get('x-real-ip') || 
                         'unknown';

        // Hash IP for privacy
        const { data: ipHashData } = await supabaseClient.rpc('hash_ip_address', { ip_text: ipAddress });
        const ipHash = ipHashData || null;

        // Fetch geolocation data (using ipapi.co free tier)
        let geolocation: GeolocationResult = {};
        try {
          if (ipAddress !== 'unknown') {
            const geoResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              geolocation = {
                city: geoData.city,
                country: geoData.country_name,
                countryCode: geoData.country_code,
                latitude: geoData.latitude || sessionData.latitude,
                longitude: geoData.longitude || sessionData.longitude,
              };
              console.log('Geolocation fetched:', geolocation);
            }
          }
        } catch (geoError) {
          console.warn('Geolocation fetch failed:', geoError);
          // Use provided lat/lng if available
          if (sessionData.latitude && sessionData.longitude) {
            geolocation.latitude = sessionData.latitude;
            geolocation.longitude = sessionData.longitude;
          }
        }

        // Check if session already exists (upsert behavior)
        const { data: existingSession } = await supabaseClient
          .from('user_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('device_stable_id', sessionData.deviceStableId)
          .single();

        let result;
        if (existingSession) {
          // Update existing session
          const { data, error } = await supabaseClient
            .from('user_sessions')
            .update({
              device_fingerprint: sessionData.deviceFingerprint,
              device_type: sessionData.deviceType,
              device_brand: sessionData.deviceBrand,
              device_model: sessionData.deviceModel,
              device_name: sessionData.deviceName,
              operating_system: sessionData.operatingSystem,
              device_os_version: sessionData.osVersion,
              browser_info: sessionData.browserName,
              browser_version: sessionData.browserVersion,
              user_agent: sessionData.userAgent,
              screen_resolution: sessionData.screenResolution,
              platform_type: sessionData.platformType,
              latitude: geolocation.latitude,
              longitude: geolocation.longitude,
              city: geolocation.city,
              country: geolocation.country,
              country_code: geolocation.countryCode,
              ip_address: ipAddress,
              ip_hash: ipHash,
              session_token: sessionData.sessionToken,
              is_active: true,
              last_activity: new Date().toISOString(),
              mfa_enabled: sessionData.mfaEnabled || false,
            })
            .eq('id', existingSession.id)
            .select()
            .single();

          if (error) throw error;
          result = data;
          console.log('Session updated:', result.id);
        } else {
          // Insert new session
          const { data, error } = await supabaseClient
            .from('user_sessions')
            .insert({
              user_id: user.id,
              device_fingerprint: sessionData.deviceFingerprint,
              device_stable_id: sessionData.deviceStableId,
              device_type: sessionData.deviceType,
              device_brand: sessionData.deviceBrand,
              device_model: sessionData.deviceModel,
              device_name: sessionData.deviceName,
              operating_system: sessionData.operatingSystem,
              device_os_version: sessionData.osVersion,
              browser_info: sessionData.browserName,
              browser_version: sessionData.browserVersion,
              user_agent: sessionData.userAgent,
              screen_resolution: sessionData.screenResolution,
              platform_type: sessionData.platformType,
              latitude: geolocation.latitude,
              longitude: geolocation.longitude,
              city: geolocation.city,
              country: geolocation.country,
              country_code: geolocation.countryCode,
              ip_address: ipAddress,
              ip_hash: ipHash,
              session_token: sessionData.sessionToken,
              is_active: true,
              mfa_enabled: sessionData.mfaEnabled || false,
            })
            .select()
            .single();

          if (error) throw error;
          result = data;
          console.log('New session created:', result.id);
        }

        return new Response(
          JSON.stringify({ success: true, session: result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_activity': {
        if (!sessionData?.deviceStableId) {
          return new Response(
            JSON.stringify({ error: 'Device stable ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabaseClient
          .from('user_sessions')
          .update({
            last_activity: new Date().toISOString(),
            is_active: true,
          })
          .eq('user_id', user.id)
          .eq('device_stable_id', sessionData.deviceStableId)
          .select()
          .single();

        if (error) throw error;

        console.log('Activity updated for session:', data.id);
        return new Response(
          JSON.stringify({ success: true, session: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'revoke': {
        if (!sessionData?.deviceStableId) {
          return new Response(
            JSON.stringify({ error: 'Device stable ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabaseClient
          .from('user_sessions')
          .delete()
          .eq('user_id', user.id)
          .eq('device_stable_id', sessionData.deviceStableId)
          .select();

        if (error) throw error;

        console.log('Session revoked:', sessionData.deviceStableId);
        return new Response(
          JSON.stringify({ success: true, deleted: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'trust': {
        if (!sessionData?.deviceStableId) {
          return new Response(
            JSON.stringify({ error: 'Device stable ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabaseClient
          .from('user_sessions')
          .update({ is_trusted: true })
          .eq('user_id', user.id)
          .eq('device_stable_id', sessionData.deviceStableId)
          .select()
          .single();

        if (error) throw error;

        console.log('Device trusted:', data.id);
        return new Response(
          JSON.stringify({ success: true, session: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in manage-session function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
