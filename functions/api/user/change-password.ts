// /api/user/change-password — dedicated, isolated password-change endpoint.
//
// SECURITY-REVIEW ISOLATION: this file is intentionally self-contained and
// separate from /api/settings so it can be independently audited.
//
// Auth is provided by Neon Managed Better Auth, which owns the `user` table and
// is the system of record for credentials. This endpoint is the session
// gateway + validation/policy layer; the cryptographic verify+hash is delegated
// to Better Auth (see ../_shared/passwordPolicy.ts for why hashing lives there
// and not on the edge).
//
// Contract:
//   POST /api/user/change-password
//   Body: { currentPassword: string, newPassword: string, confirmPassword: string }
//   Auth:  Better Auth session cookie (same-origin) OR Bearer token.
//   Responses:
//     200 { success: true, message }
//     400 new password fails policy, or current password incorrect/missing
//     401 missing/invalid session
//     422 malformed JSON, missing/invalid field types, or confirmation mismatch
//     500 upstream auth service error
//
// NOTE on body shape: the existing frontend (src/features/settings/settingsApi.ts
// changePassword) sends camelCase { currentPassword, newPassword }. This endpoint
// matches that contract. Older snake_case callers are NOT supported.
//
// CORS: responds to OPTIONS (pre-flight) and allows the app origin.

import { validatePasswordPolicy } from '../_shared/passwordPolicy';

interface Env {
  BETTER_AUTH_URL: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;
  const method = request.method;

  // CORS pre-flight.
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // 1. Authenticated session required. The browser sends Better Auth's session
  //    cookie on same-origin requests; a Bearer token is also accepted for
  //    non-browser clients. Either is sufficient.
  const cookie = request.headers.get('cookie');
  const authHeader = request.headers.get('authorization');
  if (!cookie && !authHeader) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // 2. Parse + validate the JSON body.
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid JSON body.' }, 422);
  }

  const { currentPassword, newPassword, confirmPassword } = body as {
    currentPassword?: unknown;
    newPassword?: unknown;
    confirmPassword?: unknown;
  };

  // 422 — validation errors (missing / wrong type / mismatch).
  if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
    return json({ error: 'Current password is required.', field: 'currentPassword' }, 422);
  }
  if (typeof newPassword !== 'string' || newPassword.length === 0) {
    return json({ error: 'New password is required.', field: 'newPassword' }, 422);
  }
  if (typeof confirmPassword !== 'string' || confirmPassword.length === 0) {
    return json({ error: 'Password confirmation is required.', field: 'confirmPassword' }, 422);
  }
  if (newPassword !== confirmPassword) {
    return json(
      { error: 'New password and confirmation do not match.', field: 'confirmPassword' },
      422,
    );
  }

  // 3. 400 — policy failure on the new password (includes special-char rule).
  const policy = validatePasswordPolicy(newPassword);
  if (!policy.ok) {
    return json(
      { error: policy.error ?? 'New password does not meet policy.', field: 'newPassword' },
      400,
    );
  }

  // 4. Delegate verify(current) + hash(new) to Better Auth, forwarding the
  //    session identity so Better Auth can authorize the change.
  if (!env.BETTER_AUTH_URL) {
    return json({ error: 'Server misconfiguration' }, 500);
  }

  let baRes: Response;
  try {
    baRes = await fetch(`${env.BETTER_AUTH_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      }),
    });
  } catch {
    return json({ error: 'Unable to process password change' }, 500);
  }

  if (baRes.ok) {
    // 5. Success.
    return json({ success: true, message: 'Your password has been changed.' }, 200);
  }

  // Map the Better Auth failure onto our response contract. We NEVER forward
  // Better Auth's raw error text to the client — it can leak session tokens,
  // user IDs, SQL fragments, or stack details. Only the *presence* of a
  // password-related phrase is used to pick a safe, fixed message and the
  // correct field flag. Everything else falls back to a generic message.
  let message = 'Unable to change password. Please try again.';
  let field: 'currentPassword' | 'newPassword' = 'newPassword';
  try {
    const err = (await baRes.json()) as { message?: string };
    const raw = err?.message ?? '';
    if (/current|incorrect|wrong|invalid|mismatch|password/i.test(raw)) {
      message = 'Current password is incorrect.';
      field = 'currentPassword';
    }
  } catch {
    /* non-JSON upstream error — keep the generic message */
  }

  return json({ error: message, field }, baRes.status >= 500 ? 500 : 400);
}
