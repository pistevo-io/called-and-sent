// /api/upload — R2 image upload.
//
// Endpoints:
//   POST /api/upload    Body: multipart/form-data with field `file`
//                       -> { url } public R2 read URL (or object key)
//
// Auth: requires a valid Better Auth session. Writes go to the shared
// called-and-sent-media R2 bucket, keyed by user id.

import { requireUser } from './_shared/auth';
import { json, corsPreflight } from './_shared/http';

interface Env {
  BETTER_AUTH_URL: string;
  called_and_sent_media: R2Bucket;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Expected multipart/form-data.' }, 422);
  }

  const file = form.get('file');
  if (!(file instanceof File)) return json({ error: 'file field is required.' }, 400);

  if (!ALLOWED.has(file.type)) {
    return json({ error: `Unsupported file type: ${file.type}` }, 400);
  }
  if (file.size > MAX_BYTES) {
    return json({ error: 'File exceeds 5 MB limit.' }, 413);
  }

  const ext = MIME_EXT[file.type] ?? 'bin';
  const key = `${user.id}/${crypto.randomUUID()}.${ext}`;

  await env.called_and_sent_media.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return json({ key, url: key }, 201);
}

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};
