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

    // 5C: Auto-revoke expired sessions first
    await supabaseClient.rpc('revoke_expired_sessions');

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

        // 5A: Generate composite fingerprint hash (device fingerprint + user ID)
        const compositeString = `${sessionData.deviceFingerprint}:${user.id}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(compositeString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const compositeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Get IP address from request
        const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                         req.headers.get('x-real-ip') || 
                         'unknown';

        // Hash IP for privacy
        const { data: ipHashData } = await supabaseClient.rpc('hash_ip_address', { ip_text: ipAddress });
        const ipHash = ipHashData || null;

        // Fetch real geolocation data only (no fake data)
        let geolocation: GeolocationResult = {};
        try {
          if (ipAddress !== 'unknown') {
            const geoResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              // Only use real data from API
              if (geoData.city && geoData.country_name) {
                geolocation = {
                  city: geoData.city,
                  country: geoData.country_name,
                  countryCode: geoData.country_code,
                  latitude: geoData.latitude,
                  longitude: geoData.longitude,
                };
                console.log('Real geolocation fetched:', geolocation);
              }
            }
          }
        } catch (geoError) {
          console.warn('Geolocation fetch failed:', geoError);
          // NO FALLBACK TO FAKE DATA - leave empty if geolocation fails
        }

        // 5C: Validate session token
        const { data: { user: tokenUser }, error: tokenError } = await supabaseClient.auth.getUser(sessionData.sessionToken);
        if (tokenError || !tokenUser || tokenUser.id !== user.id) {
          console.error('Invalid session token');
          return new Response(
            JSON.stringify({ error: 'Invalid session token' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if session already exists (duplicate prevention)
        const { data: existingSession } = await supabaseClient
          .from('user_sessions')
          .select('id, city, country, latitude, longitude')
          .eq('user_id', user.id)
          .eq('device_stable_id', sessionData.deviceStableId)
          .maybeSingle();

        let result;
        const isNewDevice = !existingSession;
        
        // 5C: Detect location change for security event
        const locationChanged = existingSession && (
          existingSession.city !== geolocation.city ||
          existingSession.country !== geolocation.country ||
          (existingSession.latitude && geolocation.latitude && 
           Math.abs(existingSession.latitude - geolocation.latitude) > 0.1) ||
          (existingSession.longitude && geolocation.longitude &&
           Math.abs(existingSession.longitude - geolocation.longitude) > 0.1)
        );

        if (existingSession) {
          // 5A: Update existing session (no duplicate insertion)
          const { data, error } = await supabaseClient
            .from('user_sessions')
            .update({
              device_fingerprint: sessionData.deviceFingerprint,
              composite_fingerprint_hash: compositeHash,
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
              session_status: 'active',
              last_activity: new Date().toISOString(),
              session_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
              mfa_enabled: sessionData.mfaEnabled || false,
            })
            .eq('id', existingSession.id)
            .select()
            .single();

          if (error) throw error;
          result = data;
          console.log('Session updated:', result.id);
        } else {
          // 5A: Insert new session (enforced unique by database constraint)
          const { data, error } = await supabaseClient
            .from('user_sessions')
            .insert({
              user_id: user.id,
              device_fingerprint: sessionData.deviceFingerprint,
              composite_fingerprint_hash: compositeHash,
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
              session_status: 'active',
              session_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
              mfa_enabled: sessionData.mfaEnabled || false,
            })
            .select()
            .single();

          if (error) throw error;
          result = data;
          console.log('New session created:', result.id);
        }

        // 5C: Log security events
        if (isNewDevice) {
          await supabaseClient.rpc('log_device_security_event', {
            p_user_id: user.id,
            p_event_type: 'new_device',
            p_event_description: `New device registered: ${sessionData.deviceName}`,
            p_metadata: {
              device_stable_id: sessionData.deviceStableId,
              device_type: sessionData.deviceType,
              operating_system: sessionData.operatingSystem,
              browser: sessionData.browserName,
              location: geolocation.city ? `${geolocation.city}, ${geolocation.country}` : 'Unknown'
            }
          });
        }

        if (locationChanged) {
          await supabaseClient.rpc('log_device_security_event', {
            p_user_id: user.id,
            p_event_type: 'location_change',
            p_event_description: `Device location changed from ${existingSession.city || 'Unknown'} to ${geolocation.city || 'Unknown'}`,
            p_metadata: {
              device_stable_id: sessionData.deviceStableId,
              old_location: {
                city: existingSession.city,
                country: existingSession.country,
                latitude: existingSession.latitude,
                longitude: existingSession.longitude
              },
              new_location: geolocation
            }
          });
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

        // Get session info before deletion for logging
        const { data: sessionInfo } = await supabaseClient
          .from('user_sessions')
          .select('device_name, device_type')
          .eq('user_id', user.id)
          .eq('device_stable_id', sessionData.deviceStableId)
          .maybeSingle();

        const { data, error } = await supabaseClient
          .from('user_sessions')
          .delete()
          .eq('user_id', user.id)
          .eq('device_stable_id', sessionData.deviceStableId)
          .select();

        if (error) throw error;

        // 5C: Log security event for session revocation
        if (sessionInfo) {
          await supabaseClient.rpc('log_device_security_event', {
            p_user_id: user.id,
            p_event_type: 'session_revoked',
            p_event_description: `Session revoked for device: ${sessionInfo.device_name}`,
            p_metadata: {
              device_stable_id: sessionData.deviceStableId,
              device_name: sessionInfo.device_name,
              device_type: sessionInfo.device_type
            }
          });
        }

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

        // 5C: Log security event for device trust
        await supabaseClient.rpc('log_device_security_event', {
          p_user_id: user.id,
          p_event_type: 'device_trusted',
          p_event_description: `Device marked as trusted: ${data.device_name}`,
          p_metadata: {
            device_stable_id: sessionData.deviceStableId,
            device_name: data.device_name,
            device_type: data.device_type
          }
        });

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
