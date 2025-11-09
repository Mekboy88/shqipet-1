import { AwsClient } from "https://esm.sh/aws4fetch@1.0.17";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Image size configurations
const SIZES = {
  thumbnail: { width: 80, height: 80 },
  small: { width: 300, height: 300 },
  medium: { width: 800, height: 800 },
  large: { width: 1600, height: 1600 },
} as const;

/**
 * Resize image using canvas with intelligent aspect ratio handling
 */
async function resizeImage(
  imageBlob: Blob,
  width: number,
  height: number,
  isCover: boolean = false
): Promise<Blob> {
  try {
    // Create an ImageBitmap from the blob
    const imageBitmap = await createImageBitmap(imageBlob);
    
    let targetWidth = width;
    let targetHeight = height;
    
    // For cover photos, maintain aspect ratio and use width as max dimension
    if (isCover) {
      const aspectRatio = imageBitmap.width / imageBitmap.height;
      targetWidth = width;
      targetHeight = Math.round(width / aspectRatio);
    }
    
    // @ts-ignore - OffscreenCanvas is available in Deno but not in types
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Draw the resized image
    ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
    
    // Convert to blob
    // @ts-ignore
    const resizedBlob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 0.90,
    });
    
    return resizedBlob;
  } catch (error) {
    console.error('Resize error:', error);
    // Fallback: return original blob if resize fails
    return imageBlob;
  }
}

/**
 * Upload a blob to Wasabi
 */
async function uploadToWasabi(
  aws: AwsClient,
  bucket: string,
  region: string,
  key: string,
  blob: Blob,
  contentType: string
): Promise<void> {
  const s3Base = region === 'us-east-1'
    ? 'https://s3.wasabisys.com'
    : `https://s3.${region}.wasabisys.com`;
  const putUrl = `${s3Base}/${bucket}/${key}`;
  
  const arrayBuffer = await blob.arrayBuffer();
  const putRes = await aws.fetch(putUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: new Uint8Array(arrayBuffer),
  });
  
  if (!putRes.ok) {
    const text = await putRes.text().catch(() => '');
    throw new Error(`Wasabi upload failed: ${putRes.status} ${text}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const existingKey = formData.get('existingKey') as string | null;
    const mediaType = (formData.get('mediaType') as string) || 'avatar';
    const userId = formData.get('userId') as string;
    const updateProfile = formData.get('updateProfile') as string;

    // Backfill mode: regenerate sizes from existing key
    if (existingKey && !file) {
      console.log('🔄 Backfill mode: regenerating sizes from', existingKey);
      
      const region = Deno.env.get('WASABI_REGION')!;
      const bucket = Deno.env.get('WASABI_BUCKET_NAME')!;
      const accessKeyId = Deno.env.get('WASABI_ACCESS_KEY_ID')!;
      const secretAccessKey = Deno.env.get('WASABI_SECRET_ACCESS_KEY')!;

      const aws = new AwsClient({
        accessKeyId,
        secretAccessKey,
        service: 's3',
        region,
      });

      // Fetch original from Wasabi
      const s3Base = region === 'us-east-1'
        ? 'https://s3.wasabisys.com'
        : `https://s3.${region}.wasabisys.com`;
      const getUrl = `${s3Base}/${bucket}/${existingKey}`;
      
      const getRes = await aws.fetch(getUrl);
      if (!getRes.ok) {
        throw new Error(`Failed to fetch original: ${getRes.status}`);
      }

      const originalBlob = await getRes.blob();
      const isCover = /cover/i.test(mediaType);
      const folder = isCover ? 'covers' : 'avatars';
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const baseKey = `${folder}/${userId}/${timestamp}-${random}`;

      // Create and upload all sizes
      const sizes: Record<string, string> = { original: existingKey };
      
      const resizePromises = Object.entries(SIZES).map(async ([sizeName, dimensions]) => {
        console.log(`🔧 Creating ${sizeName} (${dimensions.width}x${dimensions.height})`);
        const resizedBlob = await resizeImage(originalBlob, dimensions.width, dimensions.height, isCover);
        const sizeKey = `${baseKey}-${sizeName}.jpg`;
        
        await uploadToWasabi(aws, bucket, region, sizeKey, resizedBlob, 'image/jpeg');
        console.log(`✅ Uploaded ${sizeName}:`, sizeKey);
        
        return [sizeName, sizeKey];
      });

      const resizedResults = await Promise.all(resizePromises);
      resizedResults.forEach(([sizeName, key]) => {
        sizes[sizeName as string] = key as string;
      });

      // Update database
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const isAvatar = /avatar|profile/i.test(mediaType);
      const sizesField = isAvatar ? 'avatar_sizes' : 'cover_sizes';

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [sizesField]: sizes })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
        throw updateError;
      }

      console.log(`✅ Backfilled ${sizesField} for user ${userId}`);

      return new Response(JSON.stringify({
        success: true,
        key: existingKey,
        sizes,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Normal upload mode
    if (!file || !file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Valid image file required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🎨 Image optimization request:', { fileName: file.name, mediaType, userId });

    const region = Deno.env.get('WASABI_REGION')!;
    const bucket = Deno.env.get('WASABI_BUCKET_NAME')!;
    const accessKeyId = Deno.env.get('WASABI_ACCESS_KEY_ID')!;
    const secretAccessKey = Deno.env.get('WASABI_SECRET_ACCESS_KEY')!;

    const aws = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: 's3',
      region,
    });

    // Generate base key
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = 'jpg'; // Always use jpg for optimized images
    const isCover = /cover/i.test(mediaType);
    const folder = isCover ? 'covers' : 'avatars';
    const baseKey = `${folder}/${userId}/${timestamp}-${random}`;

    // Upload original
    const originalKey = `${baseKey}-original.${file.name.split('.').pop()}`;
    console.log('📤 Uploading original:', originalKey);
    await uploadToWasabi(aws, bucket, region, originalKey, file, file.type);

    // Create and upload all sizes in parallel
    const sizes: Record<string, string> = { original: originalKey };
    
    const resizePromises = Object.entries(SIZES).map(async ([sizeName, dimensions]) => {
      console.log(`🔧 Creating ${sizeName} (${dimensions.width}x${dimensions.height})`);
      const resizedBlob = await resizeImage(file, dimensions.width, dimensions.height, isCover);
      const sizeKey = `${baseKey}-${sizeName}.${extension}`;
      
      await uploadToWasabi(aws, bucket, region, sizeKey, resizedBlob, 'image/jpeg');
      console.log(`✅ Uploaded ${sizeName}:`, sizeKey);
      
      return [sizeName, sizeKey];
    });

    const resizedResults = await Promise.all(resizePromises);
    resizedResults.forEach(([sizeName, key]) => {
      sizes[sizeName as string] = key as string;
    });

    // Update database if requested
    if (updateProfile === 'true') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const isAvatar = /avatar|profile/i.test(mediaType);
      const urlField = isAvatar ? 'avatar_url' : 'cover_url';
      const sizesField = isAvatar ? 'avatar_sizes' : 'cover_sizes';

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          [urlField]: originalKey,
          [sizesField]: sizes,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
      } else {
        console.log(`✅ Updated profiles.${urlField} and ${sizesField} for user ${userId}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      key: originalKey,
      sizes,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Optimization error:', error);
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
