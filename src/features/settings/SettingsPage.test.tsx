// Settings password section — wiring regression test.
//
// Proves the previously UI-only Change Password form actually calls
// changePassword (settingsApi -> /api/user/change-password), validates
// current/confirm/new locally before the call, maps server field errors back
// onto the matching input, and renders success/error banners.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from './SettingsPage';
import type { ChangePasswordResult } from './settingsApi';

// Deterministic session (same pattern as the PostManager / public profile
// regression tests — no network).
vi.mock('../auth/auth', () => ({
  authClient: {
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

// Profile loading must resolve; the links sanitizer is a passthrough here.
vi.mock('../../shared/api/profile', () => ({
  getProfile: vi.fn(),
  upsertProfile: vi.fn(),
  sanitizeProfileLinks: vi.fn((links: Record<string, string>) => links),
  uploadImage: vi.fn(),
}));

// The API client under test is mocked so the component wiring is exercised
// deterministically. ProfileApiError is re-created inside the mock so the
// `instanceof` checks in SettingsPage match thrown instances.
vi.mock('./settingsApi', () => {
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
  return {
    changePassword: vi.fn(),
    ProfileApiError,
  };
});

import { authClient } from '../auth/auth';
import { getProfile } from '../../shared/api/profile';
import { changePassword, ProfileApiError } from './settingsApi';

const authedSession = {
  data: {
    user: { id: '1', slug: 'k', name: 'Keerthi' },
    session: { id: 's1', token: 'tok' },
  },
};

const okResult: ChangePasswordResult = {
  success: true,
  message: 'Your password has been changed.',
};

beforeEach(() => {
  vi.mocked(authClient.getSession).mockResolvedValue(authedSession);
  vi.mocked(getProfile).mockResolvedValue({
    slug: 'k',
    displayName: 'Keerthi K',
    bio: null,
    photoUrl: null,
    theme: 'dark',
    links: {},
  });
  vi.mocked(changePassword).mockResolvedValue(okResult);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/** Render the page, open the Password tab, and wait for the submit button. */
async function openPasswordTab() {
  render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: /^Password$/ }));
  await screen.findByRole('button', { name: /Update Password/ });
}

function fillForm(fields: { current?: string; next?: string; confirm?: string }) {
  if (fields.current !== undefined) {
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: fields.current },
    });
  }
  if (fields.next !== undefined) {
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: fields.next },
    });
  }
  if (fields.confirm !== undefined) {
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: fields.confirm },
    });
  }
}

describe('Settings password section', () => {
  it('rejects an empty submit with inline validation and no API call', async () => {
    await openPasswordTab();
    fireEvent.click(screen.getByRole('button', { name: /Update Password/ }));

    expect(await screen.findByText('Enter your current password.')).toBeTruthy();
    expect(screen.getByText('Confirm your new password.')).toBeTruthy();
    expect(
      screen.getByText('New password must be at least 8 characters long.'),
    ).toBeTruthy();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('flags a weak new password before calling the API', async () => {
    await openPasswordTab();
    fillForm({ current: 'OldPass1!', next: 'weak', confirm: 'weak' });
    fireEvent.click(screen.getByRole('button', { name: /Update Password/ }));

    expect(
      await screen.findByText('New password must be at least 8 characters long.'),
    ).toBeTruthy();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('flags a confirmation mismatch before calling the API', async () => {
    await openPasswordTab();
    fillForm({ current: 'OldPass1!', next: 'NewPass2026!', confirm: 'Different1!' });
    fireEvent.click(screen.getByRole('button', { name: /Update Password/ }));

    expect(
      await screen.findByText('New password and confirmation do not match.'),
    ).toBeTruthy();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('calls changePassword and shows the success banner on a valid submit', async () => {
    await openPasswordTab();
    fillForm({ current: 'OldPass1!', next: 'NewPass2026!', confirm: 'NewPass2026!' });
    fireEvent.click(screen.getByRole('button', { name: /Update Password/ }));

    await waitFor(() =>
      expect(changePassword).toHaveBeenCalledWith(
        'OldPass1!',
        'NewPass2026!',
        'NewPass2026!',
      ),
    );
    expect(await screen.findByText('Your password has been changed.')).toBeTruthy();
    // Fields are cleared after a successful change.
    expect((screen.getByLabelText('Current Password') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('New Password') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Confirm New Password') as HTMLInputElement).value).toBe('');
  });

  it('maps a field-scoped server error onto the current-password input', async () => {
    vi.mocked(changePassword).mockRejectedValueOnce(
      new ProfileApiError('Current password is incorrect.', 400, undefined, 'currentPassword'),
    );
    await openPasswordTab();
    fillForm({ current: 'Wrong1!', next: 'NewPass2026!', confirm: 'NewPass2026!' });
    fireEvent.click(screen.getByRole('button', { name: /Update Password/ }));

    expect(await screen.findByText('Current password is incorrect.')).toBeTruthy();
  });

  it('shows a general banner for non-field API failures', async () => {
    vi.mocked(changePassword).mockRejectedValueOnce(
      new ProfileApiError('Not signed in', 401),
    );
    await openPasswordTab();
    fillForm({ current: 'OldPass1!', next: 'NewPass2026!', confirm: 'NewPass2026!' });
    fireEvent.click(screen.getByRole('button', { name: /Update Password/ }));

    expect(await screen.findByText('Not signed in')).toBeTruthy();
  });
});
