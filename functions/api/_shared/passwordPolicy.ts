// Shared strong-password policy for the /user/change-password path.
//
// Kept in _shared so it can be unit-tested in isolation (it imports nothing
// from the Cloudflare Functions module graph — no `neon`, no `request`/`env`),
// so tests need no network, bindings, or worker runtime.
//
// WHY THIS MODULE IS POLICY-ONLY (no hashing/verification):
//   Cryptographic password hashing/verification is delegated to Better Auth —
//   the system of record for the `user` table. Cloudflare Pages Functions run
//   on the edge, where the Web Crypto API does NOT implement a memory-hard KDF
//   such as scrypt or argon2 (only PBKDF2 is available, which is weaker).
//   Re-implementing hashing here would (a) run a weaker KDF, and (b) create a
//   second password store that can desync from the credential Better Auth uses
//   for login. So this endpoint owns validation + policy + session gating, and
//   Better Auth owns the actual hash. This also keeps the dependency surface
//   clean: no bcrypt/argon2 packages are added to the project.

const MAX_PW_LEN = 128;

// Commonly-used passwords rejected outright even when they satisfy the
// character-class rules. Kept lowercased for comparison.
const COMMON_PASSWORDS = new Set([
  'password', 'password1', '12345678', 'qwerty12', 'letmein1',
  'welcome1', 'changeme1', 'iloveyou1', 'admin1234', 'passw0rd',
  'qwertyui', 'abc12345', 'iloveyou', 'monkey12', 'dragon12',
]);

export interface PasswordPolicyResult {
  ok: boolean;
  error?: string;
}

/**
 * Enforce the project's strong password policy:
 *  - minimum 8 characters (and at most 128)
 *  - at least one uppercase letter
 *  - at least one lowercase letter
 *  - at least one digit
 *  - at least one special character (!@#$%^&*()_+-=[]{}|;:'",.<>?/~` etc.; spaces are rejected)
 *  - not a commonly-used password
 *
 * Returns { ok: true } or { ok: false, error } with a 400-suitable message.
 */
export function validatePasswordPolicy(pw: unknown): PasswordPolicyResult {
  if (typeof pw !== 'string') {
    return { ok: false, error: 'New password is required.' };
  }
  if (pw.length < 8) {
    return { ok: false, error: 'New password must be at least 8 characters long.' };
  }
  if (pw.length > MAX_PW_LEN) {
    return { ok: false, error: `New password is too long (max ${MAX_PW_LEN} characters).` };
  }
  if (!/[a-z]/.test(pw)) {
    return { ok: false, error: 'New password must contain at least one lowercase letter.' };
  }
  if (!/[A-Z]/.test(pw)) {
    return { ok: false, error: 'New password must contain at least one uppercase letter.' };
  }
  if (!/\d/.test(pw)) {
    return { ok: false, error: 'New password must contain at least one number.' };
  }
  if (/\s/.test(pw)) {
    return { ok: false, error: 'New password must not contain spaces.' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/`~]/.test(pw)) {
    return { ok: false, error: 'New password must contain at least one special character.' };
  }
  if (COMMON_PASSWORDS.has(pw.toLowerCase())) {
    return { ok: false, error: 'New password is too common. Please choose a stronger password.' };
  }
  return { ok: true };
}
