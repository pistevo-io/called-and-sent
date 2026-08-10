// Client-side password-policy validator for the auth feature (reset-password
// and signup forms).
//
// DUPLICATES the rules from functions/api/_shared/passwordPolicy.ts (the
// authoritative server check) and src/features/settings/passwordValidation.ts
// (the settings form's mirror). This copy lives inside features/auth because
// CLAUDE.md Rule 2 forbids auth importing from features/settings, and Rule 4
// makes shared/ read-only without explicit instruction. The duplication is
// deliberate and rule-compliant — if the policy ever changes, update all
// three copies (server _shared, settings mirror, auth mirror) in lock-step.

const MAX_PW_LEN = 128;

// Commonly-used passwords rejected outright even when they satisfy the
// character-class rules. Kept in sync with the server's COMMON_PASSWORDS list.
const COMMON_PASSWORDS = new Set([
  'password', 'password1', '12345678', 'qwerty12', 'letmein1',
  'welcome1', 'changeme1', 'iloveyou1', 'admin1234', 'passw0rd',
  'qwertyui', 'abc12345', 'iloveyou', 'monkey12', 'dragon12',
]);

export const PASSWORD_REQUIREMENTS_TEXT =
  'Use at least 8 characters with upper and lowercase letters, a number, and a special character.';

/**
 * Validate a new password against the project's strong password policy:
 *  - minimum 8 characters (and at most 128)
 *  - at least one uppercase letter
 *  - at least one lowercase letter
 *  - at least one digit
 *  - at least one special character (spaces are rejected)
 *  - not a commonly-used password
 *
 * Returns an error message, or null when the password is acceptable. Mirrors
 * validatePasswordPolicy in functions/api/_shared/passwordPolicy.ts and
 * validateNewPassword in src/features/settings/passwordValidation.ts.
 */
export function validateNewPassword(pw: string): string | null {
  if (pw.length < 8) {
    return 'New password must be at least 8 characters long.';
  }
  if (pw.length > MAX_PW_LEN) {
    return `New password is too long (max ${MAX_PW_LEN} characters).`;
  }
  if (!/[a-z]/.test(pw)) {
    return 'New password must contain at least one lowercase letter.';
  }
  if (!/[A-Z]/.test(pw)) {
    return 'New password must contain at least one uppercase letter.';
  }
  if (!/\d/.test(pw)) {
    return 'New password must contain at least one number.';
  }
  if (/\s/.test(pw)) {
    return 'New password must not contain spaces.';
  }
  if (!/[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/`~]/.test(pw)) {
    return 'New password must contain at least one special character.';
  }
  if (COMMON_PASSWORDS.has(pw.toLowerCase())) {
    return 'New password is too common. Please choose a stronger password.';
  }
  return null;
}
