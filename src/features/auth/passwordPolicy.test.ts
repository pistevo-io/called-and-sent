// Client-side password policy mirror — regression guard for the auth feature.
//
// Proves the reset-password/signup forms' local validation stays in lock-step
// with the server policy (functions/api/_shared/passwordPolicy.ts) and the
// settings mirror (src/features/settings/passwordValidation.ts): the same rule
// messages fire on the client so users get instant feedback. This copy is
// intentionally duplicated inside features/auth (CLAUDE.md Rules 2 & 4 forbid
// auth importing from settings or modifying shared) — keep all three in sync.
import { describe, it, expect } from 'vitest';
import { validateNewPassword, PASSWORD_REQUIREMENTS_TEXT } from './passwordPolicy';

describe('validateNewPassword (auth-feature mirror of server policy)', () => {
  it('accepts a strong password', () => {
    expect(validateNewPassword('MissionTrip2026!')).toBeNull();
  });

  it('rejects a short password', () => {
    expect(validateNewPassword('Ab1!2')).toBe(
      'New password must be at least 8 characters long.',
    );
  });

  it('rejects a password without a lowercase letter', () => {
    expect(validateNewPassword('MISSION2026!')).toBe(
      'New password must contain at least one lowercase letter.',
    );
  });

  it('rejects a password without an uppercase letter', () => {
    expect(validateNewPassword('mission2026!')).toBe(
      'New password must contain at least one uppercase letter.',
    );
  });

  it('rejects a password without a number', () => {
    expect(validateNewPassword('MissionTrip!')).toBe(
      'New password must contain at least one number.',
    );
  });

  it('rejects a password containing spaces', () => {
    expect(validateNewPassword('Mission Trip 2026!')).toBe(
      'New password must not contain spaces.',
    );
  });

  it('rejects a password without a special character', () => {
    expect(validateNewPassword('MissionTrip2026')).toBe(
      'New password must contain at least one special character.',
    );
  });

  it('rejects a password longer than 128 characters', () => {
    const long = `Aa1!${'x'.repeat(130)}`;
    expect(validateNewPassword(long)).toBe(
      'New password is too long (max 128 characters).',
    );
  });

  it('exports the requirements text used in form helper copy', () => {
    expect(PASSWORD_REQUIREMENTS_TEXT).toContain('at least 8 characters');
    expect(PASSWORD_REQUIREMENTS_TEXT).toContain('special character');
  });
});
