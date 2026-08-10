// Client-side mirror of the server password policy
// (functions/api/_shared/passwordPolicy.ts — the authoritative check).
//
// Kept in the settings feature so the change-password form gives instant
// feedback without a round-trip. The server re-validates on every change; if
// the two ever drift, the server response wins and its field-scoped error is
// surfaced on the matching input.

export interface PasswordFieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const MAX_PW_LEN = 128;

// Commonly-used passwords rejected outright even when they satisfy the
// character-class rules. Kept in sync with the server's COMMON_PASSWORDS list.
const COMMON_PASSWORDS = new Set([
  'password', 'password1', '12345678', 'qwerty12', 'letmein1',
  'welcome1', 'changeme1', 'iloveyou1', 'admin1234', 'passw0rd',
  'qwertyui', 'abc12345', 'iloveyou', 'monkey12', 'dragon12',
]);

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
 * validatePasswordPolicy in functions/api/_shared/passwordPolicy.ts.
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

/**
 * Validate the whole change-password form. Returns per-field error messages;
 * a missing key means that field is valid.
 */
export function validatePasswordForm(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): PasswordFieldErrors {
  const errors: PasswordFieldErrors = {};
  if (currentPassword.length === 0) {
    errors.currentPassword = 'Enter your current password.';
  }
  const newPasswordError = validateNewPassword(newPassword);
  if (newPasswordError) {
    errors.newPassword = newPasswordError;
  }
  if (confirmPassword.length === 0) {
    errors.confirmPassword = 'Confirm your new password.';
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'New password and confirmation do not match.';
  }
  return errors;
}
