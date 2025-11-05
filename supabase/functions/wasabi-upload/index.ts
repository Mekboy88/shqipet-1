import { AwsClient } from "https://esm.sh/aws4fetch@1.0.17";
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
    // 1. VALIDATE AUTHENTICATION
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const mediaType = (formData.get('mediaType') as string) || 'profile';
    const userId = formData.get('userId') as string;
    const updateProfile = formData.get('updateProfile') as string;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. VERIFY USER MATCHES TOKEN
    if (user.id !== userId) {
      console.error('User ID mismatch:', { tokenUserId: user.id, requestedUserId: userId });
      return new Response(JSON.stringify({ error: 'Forbidden: Cannot upload for other users' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. VALIDATE FILE TYPE
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/quicktime', 'video/x-msvideo'
    ];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Allowed: images (jpg, png, webp, gif) and videos (mp4, mov, avi)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. VALIDATE FILE SIZE
    const maxSizeImage = 10 * 1024 * 1024; // 10MB
    const maxSizeVideo = 100 * 1024 * 1024; // 100MB
    const maxSize = file.type.startsWith('image/') ? maxSizeImage : maxSizeVideo;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return new Response(JSON.stringify({ error: `File too large. Maximum size: ${maxSizeMB}MB` }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Upload request:', { fileName: file.name, mediaType, userId, authenticated: true });

    const region = Deno.env.get('WASABI_REGION')!;
    const bucket = Deno.env.get('WASABI_BUCKET_NAME')!;
    const accessKeyId = Deno.env.get('WASABI_ACCESS_KEY_ID')!;
    const secretAccessKey = Deno.env.get('WASABI_SECRET_ACCESS_KEY')!;

    // Initialize AwsClient (no Node fs dependencies)
    const aws = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: 's3',
      region,
    });

    // Generate unique key
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const folder = /cover/i.test(mediaType)
      ? 'covers'
      : (/avatar|profile/i.test(mediaType)
          ? 'avatars'
          : (/post-image/i.test(mediaType)
              ? 'posts/images'
              : (/post-video/i.test(mediaType) ? 'posts/videos' : 'uploads')));
    const key = `${folder}/${userId}/${timestamp}-${random}.${extension}`;

    // Upload to Wasabi via signed PUT
    const arrayBuffer = await file.arrayBuffer();
    const s3Base = region === 'us-east-1'
      ? 'https://s3.wasabisys.com'
      : `https://s3.${region}.wasabisys.com`;
    const putUrl = `${s3Base}/${bucket}/${key}`;

    const putRes = await aws.fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: new Uint8Array(arrayBuffer),
    });

    if (!putRes.ok) {
      const text = await putRes.text().catch(() => '');
      console.error('Wasabi PUT failed:', putRes.status, text);
      return new Response(JSON.stringify({ 
        error: `Wasabi upload failed: ${putRes.status} ${text}`,
        success: false
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Upload successful:', key);

    // Only update profiles table if explicitly requested and file is an image
    const shouldUpdateProfile = updateProfile === 'true';
    const isImageFile = file.type.startsWith('image/');
    const isProfileMedia = /avatar|profile/i.test(mediaType) || /cover/i.test(mediaType);

    if (shouldUpdateProfile && isImageFile && isProfileMedia) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const field = /cover/i.test(mediaType) ? 'cover_url' : 'avatar_url';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [field]: key })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
      } else {
        console.log(`✅ Updated profiles.${field} for user ${userId}`);
      }
    } else {
      console.log('⏭️ Skipping profile update:', { shouldUpdateProfile, isImageFile, isProfileMedia });
    }

    return new Response(JSON.stringify({ 
      key,
      url: key, // Consumers should resolve this via wasabi-get-url/wasabi-proxy
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
