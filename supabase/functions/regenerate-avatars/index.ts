// Supabase Edge Function: regenerate-avatars
// Regenerates avatar variants (80/160/320/640) from the highest quality original in Wasabi
// Logs progress throughout the run.

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from "npm:@aws-sdk/client-s3";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

// Utility to stream to Uint8Array
async function streamToUint8Array(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function getEnv(name: string, fallback?: string): string {
  const v = Deno.env.get(name) ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

interface VariantDef { keySuffix: string; size: number; }
const VARIANTS: VariantDef[] = [
  { keySuffix: 'thumbnail', size: 80 },
  { keySuffix: 'small', size: 160 },
  { keySuffix: 'medium', size: 320 },
  { keySuffix: 'large', size: 640 },
];

// Derive base key (without suffix) and ext
function deriveBase(key: string): { base: string; ext: string } | null {
  const m = key.match(/^(.*)-(original|thumbnail|small|medium|large)\.(jpg|jpeg|png|webp|avif|heic)$/i);
  if (m) {
    return { base: m[1], ext: m[3].toLowerCase() };
  }
  // If doesn't match variant naming, try plain file name without suffix
  const m2 = key.match(/^(.*)\.(jpg|jpeg|png|webp)$/i);
  if (m2) {
    return { base: m2[1], ext: m2[2].toLowerCase() };
  }
  return null;
}

// Center-crop to square then resize
async function toSquareAndResize(img: Image, size: number): Promise<Image> {
  const w = img.width;
  const h = img.height;
  const side = Math.min(w, h);
  const x = Math.floor((w - side) / 2);
  const y = Math.floor((h - side) / 2);
  const cropped = img.crop(x, y, side, side);
  return cropped.resize(size, size);
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bucket = getEnv('WASABI_BUCKET_NAME');
    const region = getEnv('WASABI_REGION');
    const accessKeyId = getEnv('WASABI_ACCESS_KEY_ID');
    const secretAccessKey = getEnv('WASABI_SECRET_ACCESS_KEY');

    const s3 = new S3Client({
      region,
      endpoint: `https://s3.${region}.wasabisys.com`,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: false,
    });

    const prefix = 'avatars/';
    let continuationToken: string | undefined = undefined;

    const allObjects: Array<{ Key: string; Size: number }> = [];

    console.log('🔎 Listing avatar objects...');
    do {
      const res: any = await s3.send(new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }));
      const contents: any[] = res.Contents || [];
      contents.forEach((o: any) => {
        if (o.Key && typeof o.Size === 'number') {
          allObjects.push({ Key: o.Key, Size: o.Size });
        }
      });
      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);

    console.log(`📦 Found ${allObjects.length} objects under ${prefix}`);

    // Group by base
    const groups = new Map<string, Array<{ Key: string; Size: number }>>();
    for (const obj of allObjects) {
      const info = deriveBase(obj.Key);
      if (!info) continue;
      const base = info.base;
      if (!groups.has(base)) groups.set(base, []);
      groups.get(base)!.push(obj);
    }

    console.log(`👥 Grouped into ${groups.size} avatar sets`);

    let processed = 0;
    let skipped = 0;
    const results: any[] = [];

    for (const [base, objs] of groups) {
      // pick original if exists, else largest Size
      let candidate = objs.find(o => /-(original)\./i.test(o.Key));
      if (!candidate) {
        candidate = objs.slice().sort((a, b) => b.Size - a.Size)[0];
      }
      if (!candidate) { skipped++; continue; }

      try {
        console.log(`⬇️ Downloading source: ${candidate.Key} (${candidate.Size} bytes)`);
        const get = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: candidate.Key }));
        // @ts-ignore Body is a stream
        const body = get.Body as ReadableStream<Uint8Array>;
        const bytes = await streamToUint8Array(body);
        const img = await Image.decode(bytes);

        // Generate and upload each variant
        const uploads: string[] = [];
        for (const v of VARIANTS) {
          const outImg = await toSquareAndResize(img, v.size);
          // Always encode to JPEG at quality 100
          const jpg = await outImg.encodeJPEG(100);
          const variantKey = `${base}-${v.keySuffix}.jpg`;
          console.log(`⬆️ Uploading ${variantKey} (${jpg.length} bytes)`);
          await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: variantKey,
            Body: jpg,
            ContentType: 'image/jpeg',
            CacheControl: 'no-store, max-age=0',
          }));
          uploads.push(variantKey);
        }

        results.push({ base, source: candidate.Key, uploads });
        processed++;
        console.log(`✅ Regenerated: ${base} -> ${uploads.join(', ')}`);
      } catch (e) {
        console.error(`❌ Failed processing ${base}:`, e);
        skipped++;
      }
    }

    // Final response
    const summary = {
      totalObjects: allObjects.length,
      totalGroups: groups.size,
      processed,
      skipped,
      note: 'Variants regenerated from highest quality source. Client caches may still need to refetch; URLs signed anew will pick updated ETags.',
    };

    console.log('📊 Summary:', summary);

    return new Response(JSON.stringify({ ok: true, summary, results }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    });
  } catch (err) {
    console.error('💥 Fatal error in regeneration function:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 500,
    });
  }
});
