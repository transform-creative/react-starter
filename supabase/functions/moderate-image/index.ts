import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const QUARANTINE_BUCKET = 'quarantine_images';
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MiB hard cap
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/*****************************************
 * detectMimeType
 * Inspects raw magic bytes rather than trusting the file extension or
 * the client-supplied Content-Type header.
 */
function detectMimeType(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image/gif';
  // WebP: RIFF????WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'image/webp';
  return null;
}

/*****************************************
 * toBase64
 * Chunked base64 encoding that avoids call-stack overflows on large
 * Uint8Arrays (spread operator blows up at ~500 KB).
 */
function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/*****************************************
 * checkGoogleVisionSafeSearch
 * Returns true if the image passes moderation (safe to store).
 * Throws if the Vision API is unreachable so the caller can fail closed.
 * If GOOGLE_VISION_API_KEY is absent the check is skipped (dev/test only).
 */
async function checkGoogleVisionSafeSearch(bytes: Uint8Array): Promise<boolean> {
  if (!GOOGLE_VISION_API_KEY) {
    console.warn('GOOGLE_VISION_API_KEY not set — skipping server-side SafeSearch');
    return true;
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: toBase64(bytes) },
          features: [{ type: 'SAFE_SEARCH_DETECTION' }],
        }],
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    console.error('Google Vision API error:', response.status, body);
    throw new Error('Moderation service unavailable');
  }

  const result = await response.json();
  const annotation = result?.responses?.[0]?.safeSearchAnnotation;
  if (!annotation) throw new Error('Unexpected Vision API response shape');

  const BLOCK_LEVELS = new Set(['LIKELY', 'VERY_LIKELY']);
  return !BLOCK_LEVELS.has(annotation.adult) && !BLOCK_LEVELS.has(annotation.violence);
}

/*****************************************
 * removeQuarantineFile
 * Best-effort cleanup — errors are logged but not re-thrown so callers
 * can still return their own error response.
 */
async function removeQuarantineFile(
  serviceClient: ReturnType<typeof createClient>,
  path: string,
) {
  const { error } = await serviceClient.storage.from(QUARANTINE_BUCKET).remove([path]);
  if (error) console.error('Failed to delete quarantine file:', path, error.message);
}

/*****************************************
 * moderate-image edge function
 *
 * POST body: { quarantinePath: string, destinationBucket: string, destinationPath: string }
 *
 * Response (200): { approved: true, publicUrl: string }
 *              | { approved: false, reason: string }
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS_HEADERS });
  }

  // Verify the caller is an authenticated Supabase user
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS_HEADERS });
  }

  let quarantinePath: string, destinationBucket: string, destinationPath: string;
  try {
    ({ quarantinePath, destinationBucket, destinationPath } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: CORS_HEADERS });
  }

  if (!quarantinePath || !destinationBucket || !destinationPath) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: CORS_HEADERS });
  }

  // Ensure the quarantine path belongs to this user (prefix: {user.id}/)
  if (!quarantinePath.startsWith(`${user.id}/`)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: CORS_HEADERS });
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Download from quarantine using service role
  const { data: fileBlob, error: downloadError } = await serviceClient.storage
    .from(QUARANTINE_BUCKET)
    .download(quarantinePath);

  if (downloadError || !fileBlob) {
    console.error('Quarantine download failed:', downloadError?.message);
    return new Response(
      JSON.stringify({ error: 'File not found in quarantine' }),
      { status: 404, headers: CORS_HEADERS },
    );
  }

  const arrayBuffer = await fileBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Server-side size guard
  if (bytes.length > MAX_FILE_BYTES) {
    await removeQuarantineFile(serviceClient, quarantinePath);
    return new Response(
      JSON.stringify({ approved: false, reason: 'File exceeds maximum allowed size' }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  // Magic-byte MIME validation
  const detectedMime = detectMimeType(bytes);
  if (!detectedMime || !ALLOWED_MIME_TYPES.includes(detectedMime)) {
    await removeQuarantineFile(serviceClient, quarantinePath);
    return new Response(
      JSON.stringify({ approved: false, reason: 'Unsupported file type' }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  // Google Vision SafeSearch
  let isSafe: boolean;
  try {
    isSafe = await checkGoogleVisionSafeSearch(bytes);
  } catch (err) {
    console.error('SafeSearch error:', err);
    await removeQuarantineFile(serviceClient, quarantinePath);
    return new Response(
      JSON.stringify({ approved: false, reason: 'Image moderation service error, please try again' }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  if (!isSafe) {
    await removeQuarantineFile(serviceClient, quarantinePath);
    return new Response(
      JSON.stringify({ approved: false, reason: 'This image has been flagged as inappropriate and cannot be uploaded' }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  // Move approved file to destination bucket
  const { error: uploadError } = await serviceClient.storage
    .from(destinationBucket)
    .upload(destinationPath, fileBlob, { contentType: detectedMime, upsert: true });

  if (uploadError) {
    console.error('Destination upload failed:', uploadError.message);
    await removeQuarantineFile(serviceClient, quarantinePath);
    return new Response(
      JSON.stringify({ error: 'Failed to store approved image' }),
      { status: 500, headers: CORS_HEADERS },
    );
  }

  await removeQuarantineFile(serviceClient, quarantinePath);

  const { data: { publicUrl } } = serviceClient.storage
    .from(destinationBucket)
    .getPublicUrl(destinationPath);

  return new Response(
    JSON.stringify({ approved: true, publicUrl }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
  );
});
