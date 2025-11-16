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
        detectedType: detectedDeviceType,
      });

      // Use the device_stable_id from client, normalized to lowercase
      const normalizedId = (sessionData.deviceStableId || '').toLowerCase();
      
      const devicePayload = {
        deviceId: sessionData.deviceId,
        detectedDeviceType,
        operatingSystem: sessionData.operatingSystem,
        browserName: sessionData.browserName,
        browserVersion: sessionData.browserVersion,
        screenResolution: sessionData.screenResolution,
        platform: sessionData.platform,
        userAgent: sessionData.userAgent,
        ...locationData,
      };

      // Atomic increment via RPC (never below 1, single row per device)
      const { data: count, error: rpcError } = await supabase.rpc('bump_tabs_count', {
        p_device_stable_id: normalizedId,
        p_delta: 1,
        p_device: devicePayload,
      });
      if (rpcError) throw rpcError;

      return new Response(
        JSON.stringify({ success: true, count }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'trust') {
      console.log('🔐 Trust action received:', {
        deviceStableId: sessionData?.deviceStableId,
        isTrusted: sessionData?.isTrusted,
        userId: user.id
      });

      const targetId = (sessionData?.deviceStableId || '').toLowerCase();

      const { error } = await supabase
        .from('user_sessions')
        .update({ is_trusted: sessionData?.isTrusted ?? true })
        .eq('user_id', user.id)
        .eq('device_stable_id', targetId);

      if (error) {
        console.error('❌ Trust update failed:', error);
        throw error;
      }

      console.log('✅ Trust state updated successfully');

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'revoke') {
      if (!deviceStableId) {
        return new Response(JSON.stringify({ error: 'Device ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const targetId = (deviceStableId || '').toLowerCase();

      console.log('🔥 Revoking device session:', targetId, 'for user:', user.id);

      // 1) Insert revocation signal to trigger instant logout on target device
      const { error: signalError } = await supabase
        .from('session_revocations')
        .insert({
          user_id: user.id,
          device_stable_id: targetId
        });

      if (signalError) {
        console.error('❌ Failed to insert revocation signal:', signalError);
        throw signalError;
      }

      console.log('✅ Revocation signal inserted for device:', targetId);

      // 2) Delete the session from user_sessions
      const { error: deleteError } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id)
        .eq('device_stable_id', targetId);

      if (deleteError) {
        console.error('❌ Failed to delete session:', deleteError);
        throw deleteError;
      }

      console.log('✅ Session deleted for device:', targetId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'tab_close') {
      // Decrement active tab count when a tab closes
      const targetDeviceStableId = deviceStableId || sessionData?.deviceStableId;
      if (!targetDeviceStableId) {
        return new Response(
          JSON.stringify({ error: 'Missing deviceStableId for tab_close' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const targetId = (targetDeviceStableId || '').toLowerCase();

      // Get current count
      const { data: existing } = await supabase
        .from('user_sessions')
        .select('active_tabs_count')
        .eq('user_id', user.id)
        .eq('device_stable_id', targetId)
        .single();

      // CRITICAL: Ensure tab count never goes below 1 (one card per device)
      const newCount = Math.max((existing?.active_tabs_count ?? 1) - 1, 1);
      
      // Log if we would have gone to 0 (for debugging)
      if ((existing?.active_tabs_count ?? 1) - 1 < 1) {
        console.log('⚠️ Tab count clamped to 1 for device:', targetId);
      }

      // Update count only (device always remains active with minimum 1 tab)
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          active_tabs_count: newCount
        })
        .eq('user_id', user.id)
        .eq('device_stable_id', targetId);

      if (error) {
        console.error('Failed to decrement tab count:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Tab closed for device ${targetId}, new count: ${newCount}`);
      return new Response(
        JSON.stringify({ success: true, count: newCount }),
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
