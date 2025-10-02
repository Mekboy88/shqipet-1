const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mimeType, fileSize } = await req.json();

    const validations = {
      mimeTypeValid: ALLOWED_MIME_TYPES.includes(mimeType),
      fileSizeValid: fileSize <= MAX_FILE_SIZE,
      maxFileSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_MIME_TYPES,
    };

    const isValid = validations.mimeTypeValid && validations.fileSizeValid;

    return new Response(JSON.stringify({
      valid: isValid,
      ...validations,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Security validation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
