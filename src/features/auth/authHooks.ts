import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authClient } from './auth';

type SessionState = 'checking' | 'authed' | 'anon';

/** Shape of the Better Auth `user` row. The base fields are id/email/name/image,
 * but the SDK types allow arbitrary extra columns (e.g. a `slug`/`username`
 * handle), so we read those when present to build profile links. */
export interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  image?: string | null;
  slug?: string;
  username?: string;
  [key: string]: unknown;
}

interface UseAuthResult {
  state: SessionState;
  isAuthed: boolean;
  user: SessionUser | null;
}

export function useSessionState(): UseAuthResult {
  const [state, setState] = useState<SessionState>('checking');
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;
    authClient
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        const u = (data?.user as SessionUser | undefined) ?? null;
        setUser(u);
        setState(data?.session ? 'authed' : 'anon');
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setState('anon');
      });
    return () => {
      active = false;
    };
  }, []);

  return { state, isAuthed: state === 'authed', user };
}

/**
 * Redirects to /login (preserving the intended destination via ?from=) when the
 * visitor has no session. Use for pages that require authentication
 * (/dashboard, /settings). Pass `enabled={false}` for public/read-only views
 * (e.g. the public profile rendered inside ProfilePage) so anonymous visitors
 * are not bounced to login.
 */
export function useRequireAuth(enabled = true): UseAuthResult {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, user } = useSessionState();

  useEffect(() => {
    if (enabled && state === 'anon') {
      const from = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?from=${from}`, { replace: true });
    }
  }, [state, navigate, location.pathname, location.search, enabled]);

  return { state, isAuthed: state === 'authed', user };
}

/**
 * Redirects to /dashboard (or the ?from= target) when the visitor already has a
 * session. Use for /login and /signup so logged-in users don't see the form.
 */
export function useRedirectIfAuthed(): UseAuthResult {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, user } = useSessionState();

  useEffect(() => {
    if (state !== 'authed') return;
    const params = new URLSearchParams(location.search);
    const from = params.get('from');
    let dest = '/dashboard';
    if (from) {
      try {
        dest = decodeURIComponent(from);
      } catch {
        dest = '/dashboard';
      }
    }
    navigate(dest, { replace: true });
  }, [state, navigate, location.search]);

  return { state, isAuthed: state === 'authed', user };
}
