// /api/profile — resolve / update a missionary profile.
//
// Endpoints:
//   GET /api/profile?slug=<handle>        -> public profile data
//   PUT /api/profile                      -> update own profile (auth)
//   POST /api/profile                     -> upsert/create own profile (auth)
//
// The `slug` maps to the URL handle at /:slug.

import { requireUser } from './_shared/auth';
import { json, corsPreflight, parseJson } from './_shared/http';

interface Env {
  BETTER_AUTH_URL: string;
  called_and_sent: D1Database;
}

interface ProfileBody {
  slug?: string;
  displayName?: string;
  bio?: string;
  photoUrl?: string;
  theme?: string;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return corsPreflight();

  if (request.method === 'GET') {
    return handleGet(request, env);
  }
  if (request.method === 'POST' || request.method === 'PUT') {
    return handleUpsert(request, env);
  }

  return json({ error: 'Method not allowed' }, 405);
}

async function handleGet(request: Request, env: Env): Promise<Response> {
  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) return json({ error: 'slug query param required' }, 400);

  const row = await env.called_and_sent
    .prepare('SELECT * FROM profiles WHERE slug = ?')
    .bind(slug)
    .first<Record<string, unknown>>();

  if (!row) return json({ profile: null }, 404);

  return json({
    profile: {
      slug: row.slug,
      displayName: row.display_name ?? null,
      bio: row.bio ?? null,
      photoUrl: row.photo_url ?? null,
      theme: row.theme ?? 'dark',
    },
  });
}

async function handleUpsert(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const body = await parseJson<ProfileBody>(request);
  if (!body) return json({ error: 'Invalid JSON body.' }, 422);

  const slug = body.slug?.trim() || user.slug || user.username || user.id;
  const displayName = body.displayName ?? user.name ?? null;
  const bio = body.bio ?? null;
  const photoUrl = body.photoUrl ?? user.image ?? null;
  const theme = body.theme ?? 'dark';

  await env.called_and_sent
    .prepare(
      `INSERT INTO profiles (user_id, slug, display_name, bio, photo_url, theme)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         slug = excluded.slug,
         display_name = excluded.display_name,
         bio = excluded.bio,
         photo_url = excluded.photo_url,
         theme = excluded.theme,
         updated_at = datetime('now')`,
    )
    .bind(user.id, slug, displayName, bio, photoUrl, theme)
    .run();

  return json({ ok: true, slug });
}
