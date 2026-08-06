// /api/profile — resolve / update a missionary profile.
//
// Endpoints:
//   GET /api/profile?slug=<handle>        -> public profile data
//   PUT /api/profile                      -> update own profile (auth)
//   POST /api/profile                     -> upsert/create own profile (auth)
//
// The `slug` maps to the URL handle at /:slug.
//
// Profile links block:
//   A profile carries up to FOUR named external links: website, instagram,
//   facebook, and giving (a Donate/partner link). The server enforces the cap
//   (only these four keys are accepted) and requires any provided value to be a
//   URL-shaped string. `links` is accepted on the upsert body and returned on
//   GET as an object of only the non-empty entries, e.g.
//       { "links": { "website": "https://example.org", "instagram": "..." } }

import { requireUser } from './_shared/auth';
import { json, corsPreflight, parseJson } from './_shared/http';

interface Env {
  BETTER_AUTH_URL: string;
  called_and_sent: D1Database;
}

/** The four named slots of the profile links block (the cap is 4). */
const LINK_KEYS = ['website', 'instagram', 'facebook', 'giving'] as const;
type ProfileLinkKey = (typeof LINK_KEYS)[number];

/** Any value must be a URL-shaped string (http/https). Empty/whitespace -> null. */
function sanitizeLinkValue(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (!url.hostname) return null;
  return url.toString();
}

interface ProfileBody {
  slug?: string;
  displayName?: string;
  bio?: string;
  photoUrl?: string;
  theme?: string;
  links?: Record<string, unknown> | null;
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

/**
 * Build the links object from a raw D1 row. Only non-null, non-empty columns
 * are included, so the response is minimal and safe to spread in the UI.
 */
function linksFromRow(row: Record<string, unknown>): Record<string, string> {
  const links: Record<string, string> = {};
  for (const key of LINK_KEYS) {
    const raw = row[`${key}_url`];
    const clean = sanitizeLinkValue(raw);
    if (clean) links[key] = clean;
  }
  return links;
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
      links: linksFromRow(row),
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

  // Normalize the links block: accept only the four known keys, sanitize each
  // value to a URL or null. Unknown keys are dropped (server-owned vocabulary).
  const values: Record<ProfileLinkKey, string | null> = {
    website: null,
    instagram: null,
    facebook: null,
    giving: null,
  };
  if (body.links && typeof body.links === 'object') {
    for (const key of LINK_KEYS) {
      if (key in body.links) {
        values[key] = sanitizeLinkValue(body.links[key]);
      }
    }
  }

  await env.called_and_sent
    .prepare(
      `INSERT INTO profiles (user_id, slug, display_name, bio, photo_url, theme,
                             website_url, instagram_url, facebook_url, giving_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         slug = excluded.slug,
         display_name = excluded.display_name,
         bio = excluded.bio,
         photo_url = excluded.photo_url,
         theme = excluded.theme,
         website_url = excluded.website_url,
         instagram_url = excluded.instagram_url,
         facebook_url = excluded.facebook_url,
         giving_url = excluded.giving_url,
         updated_at = datetime('now')`,
    )
    .bind(
      user.id,
      slug,
      displayName,
      bio,
      photoUrl,
      theme,
      values.website,
      values.instagram,
      values.facebook,
      values.giving,
    )
    .run();

  return json({ ok: true, slug });
}
