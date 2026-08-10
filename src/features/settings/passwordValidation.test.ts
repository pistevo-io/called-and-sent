// Client-side password policy mirror — regression guard.
//
// Proves the settings form's local validation stays in lock-step with the
// server policy (functions/api/_shared/passwordPolicy.ts): the same rule
// messages fire on the client so users get instant feedback, and the
// form-level check flags empty fields and a confirmation mismatch.
import { describe, it, expect } from 'vitest';
import { validateNewPassword, validatePasswordForm } from './passwordValidation';

describe('validateNewPassword (client mirror of server policy)', () => {
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
});

describe('validatePasswordForm', () => {
  it('reports all missing fields', () => {
    const errors = validatePasswordForm('', '', '');
    expect(errors.currentPassword).toBe('Enter your current password.');
    expect(errors.newPassword).toBeTruthy();
    expect(errors.confirmPassword).toBe('Confirm your new password.');
  });

  it('reports a confirmation mismatch', () => {
    const errors = validatePasswordForm('OldPass1!', 'NewPass2026!', 'Different1!');
    expect(errors.confirmPassword).toBe(
      'New password and confirmation do not match.',
    );
    expect(errors.currentPassword).toBeUndefined();
    expect(errors.newPassword).toBeUndefined();
  });

  it('returns no errors for a valid form', () => {
    const errors = validatePasswordForm('OldPass1!', 'NewPass2026!', 'NewPass2026!');
    expect(errors).toEqual({});
  });
});
