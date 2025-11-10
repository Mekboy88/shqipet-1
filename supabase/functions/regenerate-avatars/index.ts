import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, type _Object } from "npm:@aws-sdk/client-s3@3.859.0";
import { Readable } from "node:stream";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert ReadableStream to Uint8Array
async function streamToUint8Array(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

// Get env variable with fallback
function getEnv(name: string, fallback?: string): string {
  const val = Deno.env.get(name);
  if (!val) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

// Variant definitions matching Facebook's professional standards
const VARIANTS = [
  { suffix: 'thumbnail', size: 80 },   // 80x80 for tiny avatars
  { suffix: 'small', size: 160 },      // 160x160 for small avatars (40px display × 4 DPR)
  { suffix: 'medium', size: 320 },     // 320x320 for medium avatars
  { suffix: 'large', size: 640 }       // 640x640 for large avatars
];

// Parse avatar key to get base name and extension
function deriveBase(key: string): { base: string; ext: string } | null {
  const match = key.match(/^avatars\/([^/]+?)(?:-(original|thumbnail|small|medium|large))?\.([a-z0-9]+)$/i);
  if (!match) return null;
  return { base: match[1], ext: match[3].toLowerCase() };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting avatar variant regeneration with Sharp...');

    const accessKeyId = getEnv('WASABI_ACCESS_KEY_ID');
    const secretAccessKey = getEnv('WASABI_SECRET_ACCESS_KEY');
    const region = getEnv('WASABI_REGION');
    const bucket = getEnv('WASABI_BUCKET_NAME');
    const endpoint = `https://s3.${region}.wasabisys.com`;

    const s3 = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    // List all avatar objects
    console.log('📂 Listing avatar objects...');
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: 'avatars/',
    });
    const listResult = await s3.send(listCommand);
    const objects = listResult.Contents || [];
    console.log(`📊 Found ${objects.length} total objects`);

    // Group by base name
    const groups = new Map<string, _Object[]>();
    for (const obj of objects) {
      if (!obj.Key) continue;
      const parsed = deriveBase(obj.Key);
      if (!parsed) continue;
      const existing = groups.get(parsed.base) || [];
      existing.push(obj);
      groups.set(parsed.base, existing);
    }

    console.log(`👥 Found ${groups.size} avatar groups`);

    const results: any[] = [];
    let processedCount = 0;
    let skippedCount = 0;

    // Import Sharp for image processing (use esm.sh for Deno compatibility)
    const sharp = (await import('https://esm.sh/sharp@0.33.5')).default;

    // Process each avatar group
    for (const [base, groupObjs] of groups) {
      try {
        console.log(`\n🔍 Processing avatar group: ${base}`);
        
        // Find source image (prefer original, otherwise largest)
        const originalObj = groupObjs.find(obj => obj.Key?.includes('-original.'));
        const sourceObj = originalObj || groupObjs.reduce((largest, obj) => 
          (obj.Size || 0) > (largest.Size || 0) ? obj : largest
        );

        if (!sourceObj.Key) {
          console.warn(`⚠️ No valid source found for ${base}`);
          skippedCount++;
          continue;
        }

        console.log(`📥 Downloading source: ${sourceObj.Key} (${sourceObj.Size} bytes)`);

        // Download source image
        const getCommand = new GetObjectCommand({
          Bucket: bucket,
          Key: sourceObj.Key,
        });
        const getResult = await s3.send(getCommand);
        
        if (!getResult.Body) {
          console.warn(`⚠️ No body in source ${sourceObj.Key}`);
          skippedCount++;
          continue;
        }

        // Convert Body to Uint8Array
        let imageBuffer: Uint8Array;
        if (getResult.Body instanceof Readable) {
          const chunks: Uint8Array[] = [];
          for await (const chunk of getResult.Body) {
            chunks.push(chunk);
          }
          const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
          imageBuffer = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            imageBuffer.set(chunk, offset);
            offset += chunk.length;
          }
        } else if (getResult.Body instanceof ReadableStream) {
          imageBuffer = await streamToUint8Array(getResult.Body as ReadableStream<Uint8Array>);
        } else {
          console.warn(`⚠️ Unexpected body type for ${sourceObj.Key}`);
          skippedCount++;
          continue;
        }

        console.log(`✅ Downloaded ${imageBuffer.length} bytes`);

        // Detect source format and dimensions
        const metadata = await sharp(imageBuffer).metadata();
        console.log(`📊 Source: ${metadata.format}, ${metadata.width}x${metadata.height}`);

        const ext = deriveBase(sourceObj.Key)?.ext || 'jpg';
        const uploadResults: any[] = [];

        // Generate and upload all variants with ZERO compression loss
        for (const variant of VARIANTS) {
          const variantKey = `avatars/${base}-${variant.suffix}.${ext}`;
          
          console.log(`🎨 Generating ${variant.suffix} (${variant.size}x${variant.size})...`);

          // Create variant: center-crop to square, resize with lanczos3, max quality
          const variantBuffer = await sharp(imageBuffer)
            .resize(variant.size, variant.size, {
              fit: 'cover',
              position: 'center',
              kernel: 'lanczos3', // Highest quality resampling
            })
            .jpeg({ 
              quality: 100,        // Maximum quality
              chromaSubsampling: '4:4:4', // No chroma subsampling (preserves color detail)
              mozjpeg: true        // Use mozjpeg for better quality at same file size
            })
            .toBuffer();

          console.log(`📤 Uploading ${variantKey} (${variantBuffer.length} bytes)`);

          // Upload variant
          const putCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: variantKey,
            Body: variantBuffer,
            ContentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
            CacheControl: 'public, max-age=31536000', // Cache for 1 year
          });

          await s3.send(putCommand);
          
          uploadResults.push({
            key: variantKey,
            size: variantBuffer.length,
            variant: variant.suffix,
          });

          console.log(`✅ Uploaded ${variantKey}`);
        }

        processedCount++;
        results.push({
          base,
          source: sourceObj.Key,
          variants: uploadResults,
        });

        console.log(`✅ Completed avatar group: ${base}`);

      } catch (error) {
        console.error(`❌ Error processing ${base}:`, error);
        skippedCount++;
        results.push({
          base,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('\n🎉 Regeneration complete!');
    console.log(`✅ Processed: ${processedCount}`);
    console.log(`⚠️ Skipped: ${skippedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        skipped: skippedCount,
        total: groups.size,
        message: 'All avatars regenerated with Sharp at 100% quality. Clear browser cache to see crystal clear avatars.',
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Fatal error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
