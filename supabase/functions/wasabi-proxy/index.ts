import { AwsClient } from "https://esm.sh/aws4fetch@1.0.17";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Try to get key from JSON body first (for supabase.functions.invoke calls)
    let key = '';
    try {
      const body = await req.json();
      key = body.key || '';
    } catch {
      // If JSON parsing fails, try query params (for direct URL calls)
      const url = new URL(req.url);
      key = url.searchParams.get('key') || '';
    }

    if (!key) {
      return new Response(JSON.stringify({ error: 'No key provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const region = Deno.env.get('WASABI_REGION')!;
    const bucket = Deno.env.get('WASABI_BUCKET_NAME')!;
    const accessKeyId = Deno.env.get('WASABI_ACCESS_KEY_ID')!;
    const secretAccessKey = Deno.env.get('WASABI_SECRET_ACCESS_KEY')!;
    const endpoint = `https://s3.${region}.wasabisys.com`;

    const aws = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region });

    const getUrl = `${endpoint}/${bucket}/${key}`;
    const res = await aws.fetch(getUrl, { method: 'GET' });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Wasabi GET failed: ${res.status} ${res.statusText} ${text}`);
    }

    // Stream through response
    return new Response(res.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': res.headers.get('content-type') || 'application/octet-stream',
        'Cache-Control': 'public, max-age=900',
      }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});