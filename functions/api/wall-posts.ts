// /api/wall-posts — CRUD + lifecycle for a missionary's wall/feed posts.
//
// Endpoints:
//   GET  /api/wall-posts?slug=<handle>   -> PUBLIC list of PUBLISHED posts for
//                                            that profile (drafts/archived never leak).
//   POST /api/wall-posts                 -> create (auth, scoped to user_id)
//   PUT  /api/wall-posts?id=<postId>     -> update OR transition status (auth)
//   DELETE /api/wall-posts?id=<postId>   -> delete (auth)
//
// Lifecycle lives on the row: status IN ('draft','published','archived')
// (ADR-0001). Public reads go through a single published-only lookup so the
// filter is written once and drafts cannot leak. Writes require a valid Better
// Auth session, scoped to the authenticated user id; a post's images live in
// the sibling post_images table (ordered references).

import { requireUser } from './_shared/auth';
import { json, corsPreflight, parseJson } from './_shared/http';

type PostStatus = 'draft' | 'published' | 'archived';

interface Env {
  BETTER_AUTH_URL: string;
  called_and_sent: D1Database;
}

interface WallPostBody {
  id?: string;
  title?: string;
  content?: string;
  postType?: string;
  status?: PostStatus;
  images?: string[];
}

const VALID_STATUSES: PostStatus[] = ['draft', 'published', 'archived'];

function isPostStatus(v: unknown): v is PostStatus {
  return typeof v === 'string' && (VALID_STATUSES as string[]).includes(v);
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

/** Map a row + its images to the public DTO a consumer sees. */
function rowToPost(row: Record<string, unknown>, images: string[] = []) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    date: row.created_at ? String(row.created_at).slice(0, 10) : undefined,
    postType: row.post_type ?? 'update',
    status: row.status ?? 'published',
    images,
  };
}

/** Single published-only lookup for a profile's posts (public read seam). */
async function publishedPosts(env: Env, userId: string) {
  return env.called_and_sent
    .prepare(
      `SELECT * FROM wall_posts
       WHERE user_id = ? AND status = 'published'
       ORDER BY created_at DESC`,
    )
    .bind(userId)
    .all();
}

/** Ordered image URLs for a post. */
async function postImages(env: Env, postId: string): Promise<string[]> {
  const { results } = await env.called_and_sent
    .prepare(
      `SELECT url FROM post_images
       WHERE post_id = ? ORDER BY sort_order ASC, id ASC`,
    )
    .bind(postId)
    .all();
  return (results as Record<string, unknown>[]).map((r) => r.url as string);
}

/** Replace a post's image set (delete + re-insert in order). */
async function replaceImages(env: Env, postId: string, images: string[]): Promise<void> {
  const tx = { batch: [] as D1PreparedStatement[] };
  tx.batch.push(
    env.called_and_sent.prepare('DELETE FROM post_images WHERE post_id = ?').bind(postId),
  );
  images.forEach((url, i) => {
    tx.batch.push(
      env.called_and_sent
        .prepare(
          'INSERT INTO post_images (id, post_id, url, sort_order) VALUES (?, ?, ?, ?)',
        )
        .bind(crypto.randomUUID(), postId, url, i),
    );
  });
  if (tx.batch.length > 0) await env.called_and_sent.batch(tx.batch);
}

async function handleList(request: Request, env: Env): Promise<Response> {
  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) return json({ error: 'slug query param required' }, 400);

  const user = await env.called_and_sent
    .prepare('SELECT user_id FROM profiles WHERE slug = ?')
    .bind(slug)
    .first<{ user_id: string }>();
  if (!user) return json({ posts: [] });

  const { results } = await publishedPosts(env, user.user_id);
  const raw = results as Record<string, unknown>[];

  const posts = await Promise.all(
    raw.map(async (r) => rowToPost(r, await postImages(env, r.id as string))),
  );

  return json({ posts });
}

async function handleCreate(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const body = await parseJson<WallPostBody>(request);
  if (!body) return json({ error: 'Invalid JSON body.' }, 422);
  if (!body.title) return json({ error: 'title is required.' }, 400);
  const status = isPostStatus(body.status) ? body.status : 'draft';

  const id = body.id ?? crypto.randomUUID();
  await env.called_and_sent
    .prepare(
      `INSERT INTO wall_posts (id, user_id, title, content, post_type, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      user.id,
      body.title ?? null,
      body.content ?? null,
      body.postType ?? 'update',
      status,
    )
    .run();

  if (body.images && body.images.length > 0) {
    await replaceImages(env, id, body.images);
  }

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

  // Status transition (publish / unpublish / archive) — only the new status is
  // required in the body; no content fields change.
  if (body.status !== undefined) {
    if (!isPostStatus(body.status)) {
      return json({ error: 'status must be draft, published, or archived.' }, 400);
    }
    await env.called_and_sent
      .prepare(
        `UPDATE wall_posts SET status = ?, updated_at = datetime('now')
         WHERE id = ? AND user_id = ?`,
      )
      .bind(body.status, id, user.id)
      .run();
    return json({ ok: true });
  }

  // Non-status fields are a partial update: only fields explicitly present in
  // the body change. `title` is NOT NULL (migration 0001), so an absent title
  // must keep the existing value rather than being nulled — COALESCE(?, col)
  // preserves the current column when the bound value is null. When the caller
  // only edits images (no title/content/postType), skip the UPDATE entirely.
  const hasFieldUpdate =
    body.title !== undefined ||
    body.content !== undefined ||
    body.postType !== undefined;

  if (hasFieldUpdate) {
    await env.called_and_sent
      .prepare(
        `UPDATE wall_posts SET title = COALESCE(?, title),
         content = COALESCE(?, content),
         post_type = COALESCE(?, post_type),
         updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
      )
      .bind(
        body.title ?? null,
        body.content ?? null,
        body.postType ?? null,
        id,
        user.id,
      )
      .run();
  }

  if (body.images) {
    await replaceImages(env, id, body.images);
  }

  return json({ ok: true });
}

async function handleDelete(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'id query param required' }, 400);

  // Cascade deletes post_images (FK ON DELETE CASCADE).
  const result = await env.called_and_sent
    .prepare('DELETE FROM wall_posts WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .run();
  if (result.meta.changes === 0) return json({ error: 'Post not found or not yours.' }, 404);

  return json({ ok: true });
}
