// /api/wall-posts — CRUD for a missionary's public wall/feed posts.
//
// Endpoints:
//   GET  /api/wall-posts?slug=<handle>   -> public list of posts for that profile
//   POST /api/wall-posts                 -> create (auth)
//   PUT  /api/wall-posts?id=<postId>     -> update (auth)
//   DELETE /api/wall-posts?id=<postId>   -> delete (auth)
//
// Public GET requires no session. Writes require a valid Better Auth session,
// scoped to the authenticated user id.

import { requireUser } from './_shared/auth';
import { json, corsPreflight, parseJson } from './_shared/http';

interface Env {
  BETTER_AUTH_URL: string;
  called_and_sent: D1Database;
}

interface WallPostBody {
  id?: string;
  title?: string;
  content?: string;
  postType?: string;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return corsPreflight();

  if (request.method === 'GET') return handleList(request, env);
  if (request.method === 'POST') return handleCreate(request, env);
  if (request.method === 'PUT') return handleUpdate(request, env);
  if (request.method === 'DELETE') return handleDelete(request, env);

  return json({ error: 'Method not allowed' }, 405);
}

async function handleList(request: Request, env: Env): Promise<Response> {
  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) return json({ error: 'slug query param required' }, 400);

  const user = await env.called_and_sent
    .prepare('SELECT user_id FROM profiles WHERE slug = ?')
    .bind(slug)
    .first<{ user_id: string }>();
  if (!user) return json({ posts: [] });

  const { results } = await env.called_and_sent
    .prepare(
      'SELECT * FROM wall_posts WHERE user_id = ? ORDER BY created_at DESC',
    )
    .bind(user.user_id)
    .all();

  const posts = (results as Record<string, unknown>[]).map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    date: r.created_at ? String(r.created_at).slice(0, 10) : undefined,
    postType: r.post_type ?? 'update',
  }));

  return json({ posts });
}

async function handleCreate(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const body = await parseJson<WallPostBody>(request);
  if (!body) return json({ error: 'Invalid JSON body.' }, 422);
  if (!body.title) return json({ error: 'title is required.' }, 400);

  const id = body.id ?? crypto.randomUUID();
  await env.called_and_sent
    .prepare(
      `INSERT INTO wall_posts (id, user_id, title, content, post_type)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(id, user.id, body.title, body.content ?? null, body.postType ?? 'update')
    .run();

  return json({ id }, 201);
}

async function handleUpdate(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'id query param required' }, 400);

  const body = await parseJson<WallPostBody>(request);
  if (!body) return json({ error: 'Invalid JSON body.' }, 422);

  const existing = await env.called_and_sent
    .prepare('SELECT id FROM wall_posts WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .first();
  if (!existing) return json({ error: 'Post not found or not yours.' }, 404);

  await env.called_and_sent
    .prepare(
      `UPDATE wall_posts SET title = ?, content = ?, post_type = ?,
       updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
    )
    .bind(body.title ?? null, body.content ?? null, body.postType ?? 'update', id, user.id)
    .run();

  return json({ ok: true });
}

async function handleDelete(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'id query param required' }, 400);

  const result = await env.called_and_sent
    .prepare('DELETE FROM wall_posts WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .run();
  if (result.meta.changes === 0) return json({ error: 'Post not found or not yours.' }, 404);

  return json({ ok: true });
}
