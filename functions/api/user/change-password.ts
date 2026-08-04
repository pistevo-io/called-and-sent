// /api/user/change-password — change-password endpoint with strict
// password-policy enforcement, confirmation matching, and security-event
// logging.
//
// Contract:
//   POST /api/user/change-password
//   Body: { current_password: string, new_password: string, confirmation: string }
//   Auth:  Bearer token (Better Auth session)
//   Responses:
//     200 { success: true }
//     400 invalid/missing fields or malformed JSON
//     401 unauthorized (missing token, invalid session, or wrong current password)
//     422 new password fails policy, or confirmation mismatch
//     502 upstream auth service unreachable
//
// The actual credential verification and re-hash are delegated to Better Auth
// (the auth source of truth) at `${BETTER_AUTH_URL}/api/auth/change-password`.
// This layer enforces the product password policy (strength + confirmation)
// and emits structured security events for observability/audit.
//
// Security-event log schema (emitted via console.info `[security_event]`):
//   { service, action, userId?, ip?, reason?, upstreamStatus?, revokedOtherSessions? }
// No tokens, passwords, or emails are ever logged.

interface Env {
  BETTER_AUTH_URL: string;
}

interface ChangePasswordBody {
  current_password?: string;
  new_password?: string;
  confirmation?: string;
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

export interface PasswordCheck {
  valid: boolean;
  errors: string[];
}

// Product password policy (mirrors the Settings UI strength meter plus a
// whitespace guard):
//   - at least 8 characters
//   - contains a lowercase letter
//   - contains an uppercase letter
//   - contains a digit
//   - contains no whitespace
export function validatePasswordStrength(pw: string): PasswordCheck {
  const errors: string[] = [];
  if (typeof pw !== 'string' || pw.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!/[a-z]/.test(pw)) {
    errors.push('Password must contain a lowercase letter.');
  }
  if (!/[A-Z]/.test(pw)) {
    errors.push('Password must contain an uppercase letter.');
  }
  if (!/\d/.test(pw)) {
    errors.push('Password must contain a digit.');
  }
  if (/\s/.test(pw)) {
    errors.push('Password must not contain whitespace.');
  }
  return { valid: errors.length === 0, errors };
}

// Emit a structured security event. Logging must never break the user-facing
// request, so failures are swallowed. Secrets/tokens/PII are intentionally
// omitted from the payload.
function logSecurityEvent(event: Record<string, unknown>): void {
  try {
    console.info(
      '[security_event]',
      JSON.stringify({
        service: 'api/user/change-password',
        ...event,
      }),
    );
  } catch {
    // logging must never break the request
  }
}

function clientIp(request: Request): string | null {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null
  );
}

async function getAuthUserId(token: string, env: Env): Promise<string | null> {
  try {
    const res = await fetch(`${env.BETTER_AUTH_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as
      | { user?: { id?: string } }
      | null;
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  if (!env.BETTER_AUTH_URL) {
    return json({ error: 'Server misconfiguration' }, 500);
  }

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
  if (!token) return json({ error: 'Unauthorized' }, 401);

  // Resolve the authenticated user up front (defense in depth + needed for
  // audit logging). Better Auth re-validates the session on the change call.
  const userId = await getAuthUserId(token, env);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  let body: ChangePasswordBody;
  try {
    body = (await request.json()) as ChangePasswordBody;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { current_password, new_password, confirmation } = body;

  if (!current_password || !new_password || !confirmation) {
    return json(
      {
        error:
          'current_password, new_password, and confirmation are required',
      },
      400,
    );
  }

  // Enforce product password policy before touching the credential.
  const strength = validatePasswordStrength(new_password);
  if (!strength.valid) {
    logSecurityEvent({
      action: 'password_change_rejected',
      reason: 'weak_password',
      userId,
      ip: clientIp(request),
    });
    return json(
      {
        error: 'New password does not meet requirements',
        details: strength.errors,
      },
      422,
    );
  }

  // Confirmation must exactly match the new password.
  if (new_password !== confirmation) {
    logSecurityEvent({
      action: 'password_change_rejected',
      reason: 'confirmation_mismatch',
      userId,
      ip: clientIp(request),
    });
    return json(
      { error: 'New password and confirmation do not match' },
      422,
    );
  }

  // Delegate verify + re-hash to Better Auth (auth source of truth).
  // revokeOtherSessions: true invalidates competing sessions so a stolen
  // session cannot survive a password change.
  let upstream: Response;
  try {
    upstream = await fetch(`${env.BETTER_AUTH_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: current_password,
        newPassword: new_password,
        revokeOtherSessions: true,
      }),
    });
  } catch {
    return json({ error: 'Unable to process password change' }, 502);
  }

  if (!upstream.ok) {
    const err = (await upstream.json().catch(() => null)) as
      | { message?: string }
      | null;
    const msg = err?.message || 'Current password is incorrect';
    logSecurityEvent({
      action: 'password_change_failed',
      reason: 'invalid_current_password',
      userId,
      ip: clientIp(request),
      upstreamStatus: upstream.status,
    });
    // Normalize a wrong-current-password 400 to 401 so the response does not
    // leak upstream internals.
    return json({ error: msg }, upstream.status === 400 ? 401 : upstream.status);
  }

  logSecurityEvent({
    action: 'password_changed',
    userId,
    ip: clientIp(request),
    revokedOtherSessions: true,
  });

  return json({ success: true });
}

export function onRequestOptions(): Response {
  return new Response(null, { headers: corsHeaders });
}
