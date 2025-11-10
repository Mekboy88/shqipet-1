import { AwsClient } from "https://esm.sh/aws4fetch@1.0.17";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SAFE FORMAT VALIDATION - Industry Standard
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const BLOCKED_EXTENSIONS = ['.bmp', '.tiff', '.tif', '.gif', '.svg', '.ico', '.nef', '.cr2', '.arw', '.mkv', '.avi', '.wmv', '.flv', '.mpeg', '.mpg', '.ogv'];

const MAX_SIZES = {
  avatar: 5 * 1024 * 1024,      // 5MB
  cover: 10 * 1024 * 1024,       // 10MB
  'post-image': 20 * 1024 * 1024, // 20MB
  'post-video': 50 * 1024 * 1024  // 50MB
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const mediaType = (formData.get('mediaType') as string) || 'profile';
    const userId = formData.get('userId') as string;
    const updateProfile = formData.get('updateProfile') as string; // 'true' to update profiles table

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SECURITY: Validate file extension
    const fileName = file.name.toLowerCase();
    const fileExtension = '.' + fileName.split('.').pop();
    if (BLOCKED_EXTENSIONS.includes(fileExtension)) {
      return new Response(JSON.stringify({ 
        error: `File type ${fileExtension} not allowed. Only safe formats: JPG, PNG, WEBP, AVIF, HEIC for images; MP4, WEBM, MOV for videos.`,
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SECURITY: Validate MIME type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
    if (!isImage && !isVideo) {
      return new Response(JSON.stringify({ 
        error: `File format ${file.type} not allowed. Only safe formats are allowed.`,
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SECURITY: Validate file size based on media type
    const maxSize = MAX_SIZES[mediaType as keyof typeof MAX_SIZES] || MAX_SIZES['post-image'];
    if (file.size > maxSize) {
      const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
      return new Response(JSON.stringify({ 
        error: `File too large. Maximum size for ${mediaType}: ${maxMB}MB`,
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SECURITY: No video avatars allowed
    if ((mediaType === 'avatar' || mediaType === 'profile') && isVideo) {
      return new Response(JSON.stringify({ 
        error: 'Video avatars are not allowed. Please use an image file.',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Upload validation passed:', { fileName: file.name, type: file.type, size: file.size, mediaType, userId });

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
