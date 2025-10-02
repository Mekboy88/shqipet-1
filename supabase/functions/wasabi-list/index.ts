import { S3Client, ListObjectsV2Command } from "https://esm.sh/@aws-sdk/client-s3@3.713.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prefix = '', maxKeys = 1000 } = await req.json();

    const s3Client = new S3Client({
      region: Deno.env.get('WASABI_REGION'),
      endpoint: `https://s3.${Deno.env.get('WASABI_REGION')}.wasabisys.com`,
      credentials: {
        accessKeyId: Deno.env.get('WASABI_ACCESS_KEY_ID')!,
        secretAccessKey: Deno.env.get('WASABI_SECRET_ACCESS_KEY')!,
      },
    });

    const command = new ListObjectsV2Command({
      Bucket: Deno.env.get('WASABI_BUCKET_NAME'),
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await s3Client.send(command);

    const files = response.Contents?.map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
    })) || [];

    return new Response(JSON.stringify({ files, count: files.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('List error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
