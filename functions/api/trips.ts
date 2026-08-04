// /api/trips — CRUD for a missionary's mission trips.
//
// Endpoints:
//   GET  /api/trips?slug=<handle>          -> public list of trips for that profile
//   POST /api/trips                        -> create (auth) Body: MissionTrip JSON
//   PUT  /api/trips?id=<tripId>            -> update (auth) Body: MissionTrip JSON
//   DELETE /api/trips?id=<tripId>          -> delete (auth)
//
// Public GET requires no session. Writes require a valid Better Auth session and
// are scoped to the authenticated user id.

import { requireUser } from './_shared/auth';
import { json, corsPreflight, parseJson } from './_shared/http';

interface Env {
  BETTER_AUTH_URL: string;
  called_and_sent: D1Database;
}

interface TripBody {
  id?: string;
  title?: string;
  location?: string;
  country?: string;
  coordinates?: { lng?: number; lat?: number };
  date?: string;
  duration?: string;
  description?: string;
  story?: string;
  images?: string[];
  highlights?: string[];
  peopleReached?: number;
  ministryType?: string[];
  status?: 'completed' | 'upcoming';
}

/** Map a D1 row to the frontend MissionTrip camelCase shape. */
function rowToTrip(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    country: row.country,
    coordinates: row.coordinates ? JSON.parse(String(row.coordinates)) : null,
    date: row.date,
    duration: row.duration,
    description: row.description,
    story: row.story,
    images: JSON.parse(String(row.images ?? '[]')),
    highlights: JSON.parse(String(row.highlights ?? '[]')),
    peopleReached: row.people_reached ?? undefined,
    ministryType: JSON.parse(String(row.ministry_type ?? '[]')),
    status: row.status ?? 'upcoming',
  };
}

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method === 'POST' && url.pathname.endsWith('/trips')) {
    return handleCreate(request, env);
  }

  if (url.pathname.endsWith('/trips')) {
    if (request.method === 'GET') return handleList(request, env);
    if (request.method === 'PUT') return handleUpdate(request, env);
    if (request.method === 'DELETE') return handleDelete(request, env);
    return json({ error: 'Method not allowed' }, 405);
  }

  return json({ error: 'Not found' }, 404);
}

async function handleList(request: Request, env: Env): Promise<Response> {
  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) return json({ error: 'slug query param required' }, 400);

  const user = await env.called_and_sent
    .prepare('SELECT user_id FROM profiles WHERE slug = ?')
    .bind(slug)
    .first<{ user_id: string }>();

  if (!user) return json({ trips: [] });

  const { results } = await env.called_and_sent
    .prepare(
      'SELECT * FROM trips WHERE user_id = ? ORDER BY sort_order ASC, date DESC',
    )
    .bind(user.user_id)
    .all();

  return json({ trips: (results as Record<string, unknown>[]).map(rowToTrip) });
}

async function handleCreate(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const body = await parseJson<TripBody>(request);
  if (!body) return json({ error: 'Invalid JSON body.' }, 422);
  if (!body.title) return json({ error: 'title is required.' }, 400);

  const id = body.id ?? crypto.randomUUID();
  await env.called_and_sent
    .prepare(
      `INSERT INTO trips
         (id, user_id, title, location, country, coordinates, date, duration,
          description, story, images, highlights, people_reached, ministry_type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      user.id,
      body.title,
      body.location ?? null,
      body.country ?? null,
      body.coordinates ? JSON.stringify(body.coordinates) : null,
      body.date ?? null,
      body.duration ?? null,
      body.description ?? null,
      body.story ?? null,
      JSON.stringify(body.images ?? []),
      JSON.stringify(body.highlights ?? []),
      body.peopleReached ?? null,
      JSON.stringify(body.ministryType ?? []),
      body.status ?? 'upcoming',
    )
    .run();

  return json({ id }, 201);
}

async function handleUpdate(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'id query param required' }, 400);

  const body = await parseJson<TripBody>(request);
  if (!body) return json({ error: 'Invalid JSON body.' }, 422);

  const existing = await env.called_and_sent
    .prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .first();
  if (!existing) return json({ error: 'Trip not found or not yours.' }, 404);

  await env.called_and_sent
    .prepare(
      `UPDATE trips SET
         title = ?, location = ?, country = ?, coordinates = ?, date = ?,
         duration = ?, description = ?, story = ?, images = ?, highlights = ?,
         people_reached = ?, ministry_type = ?, status = ?,
         updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`,
    )
    .bind(
      body.title ?? null,
      body.location ?? null,
      body.country ?? null,
      body.coordinates ? JSON.stringify(body.coordinates) : null,
      body.date ?? null,
      body.duration ?? null,
      body.description ?? null,
      body.story ?? null,
      JSON.stringify(body.images ?? []),
      JSON.stringify(body.highlights ?? []),
      body.peopleReached ?? null,
      JSON.stringify(body.ministryType ?? []),
      body.status ?? 'upcoming',
      id,
      user.id,
    )
    .run();

  return json({ ok: true });
}

async function handleDelete(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'id query param required' }, 400);

  const result = await env.called_and_sent
    .prepare('DELETE FROM trips WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .run();
  if (result.meta.changes === 0) return json({ error: 'Trip not found or not yours.' }, 404);

  return json({ ok: true });
}
