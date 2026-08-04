// Shared auth helper for Pages Functions.
//
// The app uses Neon Managed Better Auth for credentials (system of record).
// On the edge we do NOT have direct DB access for Better Auth's own tables, so
// we verify a user's session by forwarding the request's cookie to Better Auth's
// `/api/auth/get-session` endpoint (same pattern as change-password.ts). If that
// returns a session, we have the user id + email to scope D1 writes to.

interface EnvWithAuth {
  BETTER_AUTH_URL: string;
}

export interface AuthedUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  slug?: string;
  username?: string;
}

/**
 * Resolve the current session from the request cookie by asking Better Auth.
 * Returns the user when authenticated, else null.
 */
export async function requireUser(
  request: Request,
  env: EnvWithAuth,
): Promise<AuthedUser | null> {
  const cookie = request.headers.get('cookie');
  const authHeader = request.headers.get('authorization');

  if (!cookie && !authHeader && !env.BETTER_AUTH_URL) {
    return null;
  }

  // Forward the caller's identity to Better Auth to resolve the session.
  let res: Response;
  try {
    res = await fetch(`${env.BETTER_AUTH_URL}/api/auth/get-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  let session: { user?: AuthedUser } | null = null;
  try {
    session = (await res.json()) as { user?: AuthedUser } | null;
  } catch {
    return null;
  }

  const user = session?.user;
  if (!user?.id) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    slug: user.slug,
    username: user.username,
  };
}

/** Resolve a profile slug from the session user (slug ?? username ?? 'k'). */
export function userSlug(user: AuthedUser | null): string {
  return String(user?.slug ?? user?.username ?? 'k');
}
