import { S3Client, DeleteObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.713.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { key } = await req.json();

    if (!key) {
      return new Response(JSON.stringify({ error: 'No key provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const s3Client = new S3Client({
      region: Deno.env.get('WASABI_REGION'),
      endpoint: `https://s3.${Deno.env.get('WASABI_REGION')}.wasabisys.com`,
      credentials: {
        accessKeyId: Deno.env.get('WASABI_ACCESS_KEY_ID')!,
        secretAccessKey: Deno.env.get('WASABI_SECRET_ACCESS_KEY')!,
      },
    });

    const command = new DeleteObjectCommand({
      Bucket: Deno.env.get('WASABI_BUCKET_NAME'),
      Key: key,
    });

    await s3Client.send(command);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
