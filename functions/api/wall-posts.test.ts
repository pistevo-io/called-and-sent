// API integration tests for /api/wall-posts — the post lifecycle (ADR-0001).
//
// Runs under the @cloudflare/vitest-pool-workers pool (vitest.workers.config.ts),
// inside the workerd runtime, against the real wrangler Pages config: the
// `called_and_sent` D1 binding has its migrations applied and functions
// routing matches production.
//
// Auth. The main worker runs in the SAME isolate as the tests, so mocking
// `globalThis.fetch` lets us stand in for the Better Auth server that
// `requireUser` reaches out to — the wall-post functions' cookie-forwarding
// path is exercised for real, with a controllable identity per request.
//
// Storage is isolated per test file; each test seeds its own rows through the
// D1 binding.

import { beforeEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { env, exports } from 'cloudflare:workers';
import { applyD1Migrations } from 'cloudflare:test';

// The D1 schema migrations (0001 + 0002). Built in Node by
// vitest.workers.config.ts and inlined here via Vite's `define`, so the worker
// sandbox never touches the filesystem. The pool does not apply migrations
// automatically, so we apply them once per test file before seeding.
declare const __WALL_POST_MIGRATIONS__: { name: string; queries: string[] }[];

beforeAll(async () => {
  await applyD1Migrations(env.called_and_sent, __WALL_POST_MIGRATIONS__);
});

// The D1 binding name in wrangler.jsonc.
const DB = env.called_and_sent;

// Mirror of the Better Auth session cookie the client sends. The fetch mock
// maps a session token to a test user so ownership tests can use distinct ids.
const COOKIE = 'better-auth.session_token';

interface TestUser {
  id: string;
  email: string;
  slug: string;
}

const USERS: Record<string, TestUser> = {
  alice: { id: 'user-alice-0001', email: 'alice@example.com', slug: 'alice' },
  dave: { id: 'user-dave-0003', email: 'dave@example.com', slug: 'dave' },
};

const TOKEN_FOR_USER: Record<string, TestUser> = {
  'tok-alice': USERS.alice,
  'tok-dave': USERS.dave,
};

const BASE = 'https://called-and-sent.example';

// The wall-posts Pages Functions entry (the worker under test). `exports.default`
// is bound by the vitest pool to the compiled Pages bundle (vitest.workers.config.ts
// `main`); the `cloudflare:workers` typings don't model a Pages `default` export,
// so we cast to a minimal fetch-callable surface.
const handler = (exports as unknown as { default: { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> } }).default;

function req(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  // The Pages handler is a plain fetch function; pass an absolute URL so
  // Pages routing can match.
  return handler.fetch(new URL(path, BASE).toString(), init);
}

function wallUrl(slug: string): string {
  return `/api/wall-posts?slug=${encodeURIComponent(slug)}`;
}

function authedHeaders(token: string): Record<string, string> {
  return { Cookie: `${COOKIE}=${token}` };
}

async function publicList(slug: string): Promise<{ posts: Array<Record<string, unknown>> }> {
  const res = await req(wallUrl(slug));
  expect(res.status).toBe(200);
  return (await res.json()) as { posts: Array<Record<string, unknown>> };
}

/** Inserts a profile row directly, as the app's signup flow would. */
async function seedProfile(userId: string, slug: string, displayName: string) {
  await DB.prepare(
    'INSERT INTO profiles (user_id, slug, display_name) VALUES (?, ?, ?)',
  ).bind(userId, slug, displayName).run();
}

/** Wipes the tables touched by these tests so each test starts clean. */
async function wipe() {
  await DB.prepare('DELETE FROM post_images').run();
  await DB.prepare('DELETE FROM wall_posts').run();
  await DB.prepare('DELETE FROM profiles').run();
}

beforeEach(async () => {
  await wipe();

  // The `main` worker (Pages Functions, our SELF) issues outbound fetches to
  // the Better Auth server only for auth. Mock `globalThis.fetch` so those
  // calls resolve to a controllable test user; anything else passes through to
  // the real fetch.
  //
  // Note: the auth endpoint is matched by substring, not by parsing the URL.
  // Pages handlers read env from wrangler config, and `miniflare.vars` from
  // the vitest plugin does NOT propagate to the Pages `context.env`, so in the
  // test runner `env.BETTER_AUTH_URL` is undefined. `requireUser` (auth.ts)
  // therefore builds `"undefined/api/auth/get-session"` — matching on the
  // pathname substring keeps this harness decoupled from the missing var while
  // still exercising the real cookie-forwarding path. `wrangler.jsonc` is left
  // untouched so no fake `BETTER_AUTH_URL` ships to production.
  const realFetch = globalThis.fetch.bind(globalThis);
  vi.stubGlobal(
    'fetch',
    async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      const target = typeof input === 'string' ? input : (input as Request).url;
      if (target.includes('/api/auth/get-session')) {
        const cookie = (init?.headers as Record<string, string> | undefined)?.['Cookie'] ?? '';
        const match = /token=([^;]+)/.exec(cookie);
        const user = match ? TOKEN_FOR_USER[match[1]] : undefined;
        if (!user) return new Response(JSON.stringify({ user: null }), { status: 401 });
        return new Response(JSON.stringify({ user: { id: user.id, email: user.email } }), {
          status: 200,
        });
      }
      return realFetch(input, init);
    },
  );

  await seedProfile(USERS.alice.id, USERS.alice.slug, 'Alice');
  await seedProfile(USERS.dave.id, USERS.dave.slug, 'Dave');
});

describe('wall-posts lifecycle', () => {
  it('creates a post as draft by default, hidden from the public wall', async () => {
    const create = await req('/api/wall-posts', {
      method: 'POST',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({ title: 'Draft post', content: 'not ready yet' }),
    });
    expect(create.status).toBe(201);
    const { id } = (await create.json()) as { id: string };

    const list = await publicList('alice');
    expect(list.posts).toHaveLength(0);
    expect(id).toBeTruthy();
  });

  it('publishes, then unpublishes, then archives — only published is ever public', async () => {
    const create = await req('/api/wall-posts', {
      method: 'POST',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({ title: 'Lifecycle', content: 'goes through states' }),
    });
    const { id } = (await create.json()) as { id: string };

    // publish
    let put = await req(`/api/wall-posts?id=${id}`, {
      method: 'PUT',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({ status: 'published' }),
    });
    expect(put.status).toBe(200);
    let list = await publicList('alice');
    expect(list.posts.map((p) => p.id)).toContain(id);

    // unpublish -> hidden again
    put = await req(`/api/wall-posts?id=${id}`, {
      method: 'PUT',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({ status: 'draft' }),
    });
    expect(put.status).toBe(200);
    list = await publicList('alice');
    expect(list.posts.map((p) => p.id)).not.toContain(id);

    // archive -> hidden
    put = await req(`/api/wall-posts?id=${id}`, {
      method: 'PUT',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({ status: 'archived' }),
    });
    expect(put.status).toBe(200);
    list = await publicList('alice');
    expect(list.posts.map((p) => p.id)).not.toContain(id);
  });

  it('rejects an invalid status with 400', async () => {
    const create = await req('/api/wall-posts', {
      method: 'POST',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({ title: 'T', content: 'x' }),
    });
    const { id } = (await create.json()) as { id: string };

    const put = await req(`/api/wall-posts?id=${id}`, {
      method: 'PUT',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({ status: 'deleted' }),
    });
    expect(put.status).toBe(400);
  });
});

describe('wall-posts ownership scoping', () => {
  it('does not let another user update your post', async () => {
    const create = await req('/api/wall-posts', {
      method: 'POST',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({ title: "Alice's", content: 'private' }),
    });
    const { id } = (await create.json()) as { id: string };

    const put = await req(`/api/wall-posts?id=${id}`, {
      method: 'PUT',
      headers: authedHeaders('tok-dave'),
      body: JSON.stringify({ status: 'published' }),
    });
    expect(put.status).toBe(404);
  });

  it('does not let another user delete your post', async () => {
    const create = await req('/api/wall-posts', {
      method: 'POST',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({ title: "Alice's", content: 'private' }),
    });
    const { id } = (await create.json()) as { id: string };

    const del = await req(`/api/wall-posts?id=${id}`, {
      method: 'DELETE',
      headers: authedHeaders('tok-dave'),
    });
    expect(del.status).toBe(404);

    // Still present for the owner (draft, never published — confirms not deleted).
    const list = await publicList('alice');
    expect(list.posts).toHaveLength(0);
  });

  it('rejects unauthenticated writes', async () => {
    const create = await req('/api/wall-posts', {
      method: 'POST',
      headers: { Cookie: `${COOKIE}=tok-unknown` },
      body: JSON.stringify({ title: 'anon', content: 'x' }),
    });
    expect(create.status).toBe(401);
  });
});

describe('wall-posts public wall', () => {
  it('returns only published posts across owners; drafts and archives hidden', async () => {
    await req('/api/wall-posts', {
      method: 'POST',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({ title: 'A published', status: 'published' }),
    });
    await req('/api/wall-posts', {
      method: 'POST',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({ title: 'A hidden draft' }),
    });
    await req('/api/wall-posts', {
      method: 'POST',
      headers: authedHeaders('tok-dave'),
      body: JSON.stringify({ title: 'D published', status: 'published' }),
    });

    const alice = await publicList('alice');
    expect(alice.posts.map((p) => p.title)).toEqual(['A published']);

    const dave = await publicList('dave');
    expect(dave.posts.map((p) => p.title)).toEqual(['D published']);

    const unknown = await publicList('nobody');
    expect(unknown.posts).toHaveLength(0);
  });

  it('returns 401 for an unauthenticated list without slug', async () => {
    const res = await req('/api/wall-posts');
    expect(res.status).toBe(401);
  });

  it('returns images alongside a published post', async () => {
    const create = await req('/api/wall-posts', {
      method: 'POST',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({
        title: 'With pics',
        status: 'published',
        images: ['https://cdn.example.com/a.png', 'https://cdn.example.com/b.png'],
      }),
    });
    expect(create.status).toBe(201);

    const list = await publicList('alice');
    expect(list.posts).toHaveLength(1);
    expect(list.posts[0].images).toEqual([
      'https://cdn.example.com/a.png',
      'https://cdn.example.com/b.png',
    ]);
  });

  it('lets the owner replace the image set on update', async () => {
    const create = await req('/api/wall-posts', {
      method: 'POST',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({ title: 'Swap pics', status: 'published', images: ['https://x/a'] }),
    });
    const { id } = (await create.json()) as { id: string };

    const put = await req(`/api/wall-posts?id=${id}`, {
      method: 'PUT',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({ images: ['https://x/b', 'https://x/c'] }),
    });
    expect(put.status).toBe(200);

    const list = await publicList('alice');
    expect(list.posts[0].images).toEqual(['https://x/b', 'https://x/c']);
  });
});

describe('wall-posts owner read (dashboard post manager)', () => {
  it('returns ALL statuses for the authenticated user (no slug)', async () => {
    await req('/api/wall-posts', {
      method: 'POST',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({ title: 'A published', status: 'published' }),
    });
    await req('/api/wall-posts', {
      method: 'POST',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({ title: 'A draft' }),
    });
    await req('/api/wall-posts', {
      method: 'POST',
      headers: authedHeaders('tok-alice'),
      body: JSON.stringify({ title: 'A archived', status: 'archived' }),
    });
    // Another user's post must NOT leak into Alice's owner list.
    await req('/api/wall-posts', {
      method: 'POST',
      headers: authedHeaders('tok-dave'),
      body: JSON.stringify({ title: 'Dave draft' }),
    });

    const res = await req('/api/wall-posts', { headers: authedHeaders('tok-alice') });
    expect(res.status).toBe(200);
    const { posts } = (await res.json()) as { posts: Array<Record<string, unknown>> };

    // Every status present, only Alice's posts.
    const titles = posts.map((p) => p.title);
    expect(titles).toEqual(expect.arrayContaining(['A published', 'A draft', 'A archived']));
    expect(titles).not.toContain('Dave draft');
    const statuses = posts.map((p) => p.status);
    expect(statuses).toEqual(expect.arrayContaining(['draft', 'published', 'archived']));
  });

  it('returns an empty list for an authed user with no posts', async () => {
    const res = await req('/api/wall-posts', { headers: authedHeaders('tok-dave') });
    expect(res.status).toBe(200);
    const { posts } = (await res.json()) as { posts: Array<Record<string, unknown>> };
    expect(posts).toHaveLength(0);
  });
});
