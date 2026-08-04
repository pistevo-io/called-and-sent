// /api/settings — profile, password, and theme management
// GET  /api/settings          — fetch user + profile
// PUT  /api/settings          — update profile fields
// POST /api/settings/password — change password
// PUT  /api/settings/theme    — update theme preference

import { neon } from '@neondatabase/serverless';

interface Env {
  NEON_DATABASE_URL: string;
  BETTER_AUTH_URL: string;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
}

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  photo_url?: string | null;
  bio?: string | null;
  testimony?: string | null;
  location?: string | null;
  church?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  website_url?: string | null;
  giving_url?: string | null;
  theme: 'dark' | 'light';
  is_public: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function fetchAuthUser(token: string, env: Env): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${env.BETTER_AUTH_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user: AuthUser };
    return data.user ?? null;
  } catch {
    return null;
  }
}

// ─── PROFILE DB ─────────────────────────────────────────────────

type Sql = ReturnType<typeof neon>;

async function getProfile(
  userId: string,
  sql: Sql,
): Promise<Profile | undefined> {
  const rows = await sql`SELECT * FROM profiles WHERE user_id = ${userId} LIMIT 1`;
  return (rows as unknown as Profile[])[0] ?? undefined;
}

async function upsertProfile(
  userId: string,
  data: Partial<Profile>,
  sql: Sql,
): Promise<Profile> {
  const existing = await getProfile(userId, sql);
  if (existing) {
    const setClauses: string[] = [];
    const vals: unknown[] = [];
    const skip = new Set([
      'id',
      'user_id',
      'created_at',
      'updated_at',
    ]);
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && !skip.has(k)) {
        vals.push(v);
        setClauses.push(`${k} = $${vals.length}`);
      }
    }
    if (setClauses.length === 0) return existing;
    vals.push(userId);
    const rows =
      await sql`UPDATE profiles SET ${sql.unsafe(setClauses.join(', '))}, updated_at = now() WHERE user_id = $${vals.length} RETURNING *`;
    return (rows as unknown as Profile[])[0];
  }

  // Insert new profile
  const username =
    data.username ||
    (data.display_name || 'user').toLowerCase().replace(/\s+/g, '-');
  const display_name = data.display_name || username;

  const rows =
    await sql`INSERT INTO profiles (user_id, username, display_name, bio, testimony, location, church, theme) VALUES (${userId}, ${username}, ${display_name}, ${data.bio ?? null}, ${data.testimony ?? null}, ${data.location ?? null}, ${data.church ?? null}, ${data.theme ?? 'dark'}) RETURNING *`;
  return (rows as unknown as Profile[])[0];
}

// ─── HANDLERS ───────────────────────────────────────────────────

async function handleGetSettings(
  token: string,
  env: Env,
): Promise<Response> {
  const user = await fetchAuthUser(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const sql = neon(env.NEON_DATABASE_URL);
  const profile = await getProfile(user.id, sql);

  return json({
    user: { id: user.id, email: user.email, name: user.name, image: user.image },
    profile: profile ?? null,
  });
}

async function handleUpdateProfile(
  token: string,
  body: Record<string, unknown>,
  env: Env,
): Promise<Response> {
  const user = await fetchAuthUser(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const sql = neon(env.NEON_DATABASE_URL);

  // Update Better Auth user fields (name, image)
  const authUpdates: Record<string, unknown> = {};
  if (typeof body.name === 'string') authUpdates.name = body.name;
  if (typeof body.image === 'string') authUpdates.image = body.image;

  if (Object.keys(authUpdates).length > 0) {
    await fetch(`${env.BETTER_AUTH_URL}/api/auth/update-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(authUpdates),
    });
  }

  // Update profiles table fields
  const profileFields: Record<string, unknown> = {};
  const allowed = [
    'display_name',
    'username',
    'bio',
    'testimony',
    'location',
    'church',
    'instagram_url',
    'facebook_url',
    'website_url',
    'giving_url',
    'photo_url',
    'is_public',
  ];
  for (const k of allowed) {
    if (k in body) profileFields[k] = body[k];
  }
  if (typeof body.name === 'string' && !('display_name' in body)) {
    profileFields.display_name = body.name;
  }

  const profile = await upsertProfile(user.id, profileFields, sql);
  return json({ profile, user: { ...user, ...authUpdates } });
}

async function handleChangePassword(
  token: string,
  body: Record<string, unknown>,
  env: Env,
): Promise<Response> {
  const user = await fetchAuthUser(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const { currentPassword, newPassword } = body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return json(
      { error: 'Current password and new password are required' },
      400,
    );
  }

  if (newPassword.length < 8) {
    return json(
      { error: 'New password must be at least 8 characters' },
      400,
    );
  }

  const res = await fetch(`${env.BETTER_AUTH_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({
      message: 'Failed to change password',
    }))) as { message?: string };
    return json({ error: err.message || 'Failed to change password' }, res.status);
  }

  return json({ success: true });
}

async function handleUpdateTheme(
  token: string,
  body: Record<string, unknown>,
  env: Env,
): Promise<Response> {
  const user = await fetchAuthUser(token, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const { theme } = body as { theme?: string };
  if (!theme || !['dark', 'light'].includes(theme)) {
    return json({ error: 'Theme must be "dark" or "light"' }, 400);
  }

  const sql = neon(env.NEON_DATABASE_URL);
  const profile = await upsertProfile(user.id, { theme: theme as 'dark' | 'light' }, sql);
  return json({ theme: profile.theme });
}

// ─── ROUTER ─────────────────────────────────────────────────────

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace(/^\/api\/settings\/?/, '');

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return json({ error: 'Unauthorized' }, 401);

  try {
    // GET /api/settings
    if (method === 'GET' && (path === '')) {
      return handleGetSettings(token, env);
    }

    if (method === 'PUT' && (path === '')) {
      let body: Record<string, unknown>;
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return json({ error: 'Invalid JSON' }, 400);
      }
      return handleUpdateProfile(token, body, env);
    }

    if (method === 'POST' && path === 'password') {
      let body: Record<string, unknown>;
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return json({ error: 'Invalid JSON' }, 400);
      }
      return handleChangePassword(token, body, env);
    }

    if (method === 'PUT' && path === 'theme') {
      let body: Record<string, unknown>;
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return json({ error: 'Invalid JSON' }, 400);
      }
      return handleUpdateTheme(token, body, env);
    }

    return json({ error: 'Not found' }, 404);
  } catch (err: unknown) {
    console.error('Settings API error:', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return json({ error: msg }, 500);
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders });
}
