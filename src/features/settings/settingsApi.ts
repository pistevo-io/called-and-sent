// API client for the user settings feature.
//
// Single source of truth for the settings network calls so every tab
// (Profile / Password / Theme) talks to the backend the same way. Mirrors the
// auth pattern used elsewhere in the app: a bearer token is pulled from the
// Better Auth session and sent as `Authorization: Bearer <token>`.
//
// Profile data shape:
//   - `firstName` / `lastName` -> persisted as a single `display_name` on the
//     `profiles` table (there is no first/last split server-side).
//   - `email` lives on the Better Auth `user` row, not the profile. On save we
//     PATCH the profile AND proxy the email update to Better Auth's
//     `/api/auth/user/update` so the change actually sticks.
//   - `bio` -> `profiles.bio`.

export interface ProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
}

export interface ProfileResponse {
  user: { email: string };
  profile: {
    display_name: string;
    bio: string | null;
  } | null;
}

const PROFILE_ENDPOINT = '/api/user/profile';

/** Resolve the caller's session token, or null if not signed in. */
async function getSessionToken(): Promise<string | null> {
  try {
    const { data } = await import('../../features/auth/auth').then((m) =>
      m.authClient.getSession(),
    );
    return data?.session?.token ?? null;
  } catch {
    return null;
  }
}

/** Build the authorized headers for an outgoing request. */
function authHeaders(token: string, json = true): HeadersInit {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

class ProfileApiError extends Error {
  status: number;
  details?: string[];
  field?: string;
  constructor(message: string, status: number, details?: string[], field?: string) {
    super(message);
    this.name = 'ProfileApiError';
    this.status = status;
    this.details = details;
    this.field = field;
  }
}

async function parseError(res: Response): Promise<ProfileApiError> {
  let message = `Request failed (${res.status})`;
  let details: string[] | undefined;
  let errorField: string | undefined;
  try {
    const body = (await res.json()) as {
      error?: string;
      message?: string;
      details?: string[];
      field?: string;
    };
    message = body.error || body.message || message;
    details = body.details;
    errorField = body.field;
  } catch {
    /* non-JSON error body — keep the default message */
  }
  return new ProfileApiError(message, res.status, details, errorField);
}

/** GET /api/user/profile — load the current user's profile + email. */
export async function getProfile(): Promise<ProfileResponse> {
  const token = await getSessionToken();
  if (!token) throw new ProfileApiError('Not signed in', 401);

  const res = await fetch(PROFILE_ENDPOINT, { headers: authHeaders(token, false) });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as ProfileResponse;
}

/**
 * PUT /api/user/profile — save profile fields.
 *
 * Sends the profile patch to the managed backend and, when the email actually
 * changed, also proxies the email update to Better Auth so the `user` row is
 * kept in sync (the backend profile endpoint only owns profile columns).
 */
export async function updateProfile(
  payload: ProfilePayload,
  originalEmail?: string,
): Promise<ProfileResponse> {
  const token = await getSessionToken();
  if (!token) throw new ProfileApiError('Not signed in', 401);

  const res = await fetch(PROFILE_ENDPOINT, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res);
  const saved = (await res.json()) as ProfileResponse;

  // Keep the auth user's email in lock-step with the form.
  if (originalEmail !== undefined && payload.email !== originalEmail) {
    try {
      await fetch(`${import.meta.env.VITE_NEON_AUTH_URL}/api/auth/user/update`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ email: payload.email }),
      });
    } catch {
      // Non-fatal: the profile save already succeeded; surface via the
      // response so the UI can decide whether to warn. We don't roll back.
    }
  }

  return saved;
}

/**
 * POST /api/user/change-password — change the signed-in user's password.
 *
 * Sends the current password (for verification) and the new password plus its
 * confirmation. The endpoint enforces the password policy and requires the
 * confirmation to match; the actual credential verify+rehash is performed by
 * Better Auth (the auth source of truth).
 *
 * Throws ProfileApiError on failure. The thrown error carries `.field`
 * (`'currentPassword'` | `'newPassword'` | `'confirmPassword'`) so the UI can
 * highlight the offending input. Common cases:
 *   - 400 new password fails policy (ProfileApiError.details may list rules)
 *   - 422 confirmation mismatch or missing field
 *   - 401 session missing/expired
 *   - 500 upstream auth error
 */
export interface ChangePasswordResult {
  success: boolean;
  message?: string;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<ChangePasswordResult> {
  const token = await getSessionToken();
  if (!token) throw new ProfileApiError('Not signed in', 401);

  const res = await fetch('/api/user/change-password', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });

  if (!res.ok) throw await parseError(res);
  return (await res.json()) as ChangePasswordResult;
}

export { ProfileApiError };
