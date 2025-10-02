import { S3Client, HeadBucketCommand, ListObjectsV2Command } from "https://esm.sh/@aws-sdk/client-s3@3.713.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const tests = [];
  let overallSuccess = true;

  try {
    // Test 1: Environment variables
    const envVars = {
      hasAccessKey: !!Deno.env.get('WASABI_ACCESS_KEY_ID'),
      hasSecretKey: !!Deno.env.get('WASABI_SECRET_ACCESS_KEY'),
      hasBucket: !!Deno.env.get('WASABI_BUCKET_NAME'),
      hasRegion: !!Deno.env.get('WASABI_REGION'),
      bucket: Deno.env.get('WASABI_BUCKET_NAME'),
      region: Deno.env.get('WASABI_REGION'),
    };

    const envSuccess = Object.values(envVars).every(v => v);
    tests.push({
      name: 'Environment Variables',
      success: envSuccess,
      details: envVars,
    });
    overallSuccess = overallSuccess && envSuccess;

    // Test 2: S3 Client initialization
    let s3Client;
    try {
      s3Client = new S3Client({
        region: Deno.env.get('WASABI_REGION'),
        endpoint: `https://s3.${Deno.env.get('WASABI_REGION')}.wasabisys.com`,
        credentials: {
          accessKeyId: Deno.env.get('WASABI_ACCESS_KEY_ID')!,
          secretAccessKey: Deno.env.get('WASABI_SECRET_ACCESS_KEY')!,
        },
      });
      tests.push({
        name: 'S3 Client Init',
        success: true,
        details: { endpoint: `https://s3.${Deno.env.get('WASABI_REGION')}.wasabisys.com` },
      });
    } catch (error) {
      tests.push({
        name: 'S3 Client Init',
        success: false,
        error: error.message,
      });
      overallSuccess = false;
    }

    // Test 3: Bucket access
    if (s3Client) {
      try {
        const headBucketCommand = new HeadBucketCommand({
          Bucket: Deno.env.get('WASABI_BUCKET_NAME'),
        });
        await s3Client.send(headBucketCommand);
        tests.push({
          name: 'Bucket Access',
          success: true,
          details: { bucket: Deno.env.get('WASABI_BUCKET_NAME') },
        });
      } catch (error) {
        tests.push({
          name: 'Bucket Access',
          success: false,
          error: error.message,
        });
        overallSuccess = false;
      }

      // Test 4: List objects (optional)
      try {
        const listCommand = new ListObjectsV2Command({
          Bucket: Deno.env.get('WASABI_BUCKET_NAME'),
          MaxKeys: 1,
        });
        const listResponse = await s3Client.send(listCommand);
        tests.push({
          name: 'List Objects',
          success: true,
          details: { objectCount: listResponse.KeyCount || 0 },
        });
      } catch (error) {
        tests.push({
          name: 'List Objects',
          success: false,
          error: error.message,
        });
        overallSuccess = false;
      }
    }

    return new Response(JSON.stringify({
      success: overallSuccess,
      tests,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Connection test error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      tests,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
