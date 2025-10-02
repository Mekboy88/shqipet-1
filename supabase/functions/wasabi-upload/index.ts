import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.713.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const mediaType = formData.get('mediaType') as string || 'profile';
    const userId = formData.get('userId') as string;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Upload request:', { fileName: file.name, mediaType, userId });

    // Initialize Wasabi S3 client with forcePathStyle and explicit config
    const s3Client = new S3Client({
      region: Deno.env.get('WASABI_REGION')!,
      endpoint: `https://s3.${Deno.env.get('WASABI_REGION')}.wasabisys.com`,
      credentials: {
        accessKeyId: Deno.env.get('WASABI_ACCESS_KEY_ID')!,
        secretAccessKey: Deno.env.get('WASABI_SECRET_ACCESS_KEY')!,
      },
      forcePathStyle: false,
      // Disable file system config loading for Deno
      defaultsMode: 'standard',
    });

    // Generate unique key
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const folder = mediaType === 'cover' ? 'covers' : mediaType === 'profile' ? 'avatars' : 'gallery';
    const key = `${folder}/${userId}/${timestamp}-${random}.${extension}`;

    // Upload to Wasabi
    const arrayBuffer = await file.arrayBuffer();
    const uploadCommand = new PutObjectCommand({
      Bucket: Deno.env.get('WASABI_BUCKET_NAME'),
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
    });

    await s3Client.send(uploadCommand);

    console.log('✅ Upload successful:', key);

    // Update profile table with the key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (mediaType === 'profile' || mediaType === 'cover') {
      const field = mediaType === 'profile' ? 'avatar_url' : 'cover_url';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [field]: key })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
      }
    }

    return new Response(JSON.stringify({ 
      key,
      url: key,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
