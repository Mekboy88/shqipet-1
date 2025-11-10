import { AwsClient } from "https://esm.sh/aws4fetch@1.0.17";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SAFE FORMAT VALIDATION - Industry Standard
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/jfif', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const BLOCKED_EXTENSIONS = ['.bmp', '.tiff', '.tif', '.gif', '.svg', '.ico', '.nef', '.cr2', '.arw', '.mkv', '.avi', '.wmv', '.flv', '.mpeg', '.mpg', '.ogv'];

const MAX_SIZES = {
  avatar: 10 * 1024 * 1024,     // 10MB (align with frontend and cover)
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

    // Load dynamic upload configuration from database (fallback to defaults)
    let IMAGE_MIME_ALLOW = ALLOWED_IMAGE_TYPES as string[];
    let VIDEO_MIME_ALLOW = ALLOWED_VIDEO_TYPES as string[];
    let BLOCKED_EXTS = BLOCKED_EXTENSIONS as string[];
    let MAX_LIMITS = MAX_SIZES as Record<string, number>;
let allowedImageExts = ['jpg', 'jpeg', 'jfif', 'pjpeg', 'png', 'webp', 'avif', 'heic', 'heif'];
let allowedVideoExts = ['mp4', 'webm', 'mov'];

    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      const { data: cfg, error: cfgError } = await supabase.rpc('get_upload_configuration');
      if (!cfgError && cfg) {
        IMAGE_MIME_ALLOW = Array.isArray(cfg.allowed_image_mime_types) ? cfg.allowed_image_mime_types : IMAGE_MIME_ALLOW;
        VIDEO_MIME_ALLOW = Array.isArray(cfg.allowed_video_mime_types) ? cfg.allowed_video_mime_types : VIDEO_MIME_ALLOW;
        allowedImageExts = Array.isArray(cfg.allowed_image_extensions) ? cfg.allowed_image_extensions.map((s: string) => (s || '').toLowerCase().replace(/^\./, '')) : allowedImageExts;
        allowedVideoExts = Array.isArray(cfg.allowed_video_extensions) ? cfg.allowed_video_extensions.map((s: string) => (s || '').toLowerCase().replace(/^\./, '')) : allowedVideoExts;
        const blockedImages = Array.isArray(cfg.blocked_image_extensions) ? cfg.blocked_image_extensions : [];
        const blockedVideos = Array.isArray(cfg.blocked_video_extensions) ? cfg.blocked_video_extensions : [];
        BLOCKED_EXTS = Array.from(new Set([ ...BLOCKED_EXTS, ...blockedImages, ...blockedVideos ]));
        MAX_LIMITS = {
          avatar: typeof cfg.max_avatar_size === 'number' ? cfg.max_avatar_size : MAX_SIZES.avatar,
          cover: typeof cfg.max_cover_size === 'number' ? cfg.max_cover_size : MAX_SIZES.cover,
          'post-image': typeof cfg.max_post_image_size === 'number' ? cfg.max_post_image_size : MAX_SIZES['post-image'],
          'post-video': typeof cfg.max_post_video_size === 'number' ? cfg.max_post_video_size : MAX_SIZES['post-video'],
        } as Record<string, number>;
      }
    } catch (e) {
      console.warn('⚠️ Using default upload configuration due to fetch error', e);
    }

    // SECURITY: Validate file extension
    const fileName = file.name.toLowerCase();
    const fileExtension = '.' + (fileName.split('.').pop() || '');
    if (BLOCKED_EXTS.includes(fileExtension)) {
      console.error('🚫 BLOCKED: File extension not allowed:', { fileName, extension: fileExtension });
      return new Response(JSON.stringify({ 
        error: `File type ${fileExtension} not allowed. Only safe formats are permitted.`,
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SECURITY: Validate MIME type (with extension fallback for mobile formats)
    const isImage = IMAGE_MIME_ALLOW.includes(file.type);
    const isVideo = VIDEO_MIME_ALLOW.includes(file.type);
    
    // HEIC/AVIF may have inconsistent MIME types, check extension as fallback
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    const isImageByExtension = allowedImageExts.includes(ext);
    const isVideoByExtension = allowedVideoExts.includes(ext);
    
    let isValidImage = isImage || isImageByExtension;
    let isValidVideo = isVideo || isVideoByExtension;

    // FINAL GUARD: If both false but intent is image (avatar/cover/post-image), allow unknown MIME/extension
    const imageIntent = /avatar|profile|cover|post-image/i.test(mediaType);
    if (!isValidImage && !isValidVideo && imageIntent) {
      // Permit if not explicitly blocked and not a known video extension
      if (!BLOCKED_EXTS.includes(`.${ext}`) && !isVideoByExtension) {
        isValidImage = true;
      }
    }

    if (!isValidImage && !isValidVideo) {
      console.error('🚫 BLOCKED: Invalid MIME/extension:', { fileName, mimeType: file.type, ext, mediaType });
      return new Response(JSON.stringify({ 
        error: `File format ${file.type || '(unknown)'} not allowed.`,
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // SECURITY: Validate file size based on media type
    const maxSize = MAX_LIMITS[mediaType as keyof typeof MAX_SIZES] || MAX_LIMITS['post-image'];
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
    if ((mediaType === 'avatar' || mediaType === 'profile') && isValidVideo) {
      console.error('🚫 BLOCKED: Video avatar not allowed:', { fileName, mediaType });
      return new Response(JSON.stringify({ 
        error: 'Video avatars are not allowed. Please use an image file.',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Upload validation passed:', { fileName: file.name, type: file.type, size: file.size, mediaType, userId, isImage: isValidImage, isVideo: isValidVideo });

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
