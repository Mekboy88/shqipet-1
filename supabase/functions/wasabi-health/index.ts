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
    const region = Deno.env.get('WASABI_REGION')!;
    const bucket = Deno.env.get('WASABI_BUCKET_NAME')!;
    const accessKeyId = Deno.env.get('WASABI_ACCESS_KEY_ID')!;
    const secretAccessKey = Deno.env.get('WASABI_SECRET_ACCESS_KEY')!;
    const endpoint = `https://s3.${region}.wasabisys.com`;

    const aws = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region });

    const url = `${endpoint}/${bucket}?list-type=2&max-keys=0`;
    const res = await aws.fetch(url, { method: 'GET' });

    const ok = res.ok;

    return new Response(JSON.stringify({
      status: ok ? 'healthy' : 'unhealthy',
      bucket,
      region,
      timestamp: new Date().toISOString(),
    }), {
      status: ok ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Health check error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: message,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});