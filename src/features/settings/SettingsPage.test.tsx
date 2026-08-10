// Settings regression tests — password wiring + appearance theme persistence.
//
// Password: proves the previously UI-only Change Password form actually calls
// changePassword (settingsApi -> /api/user/change-password), validates
// current/confirm/new locally before the call, maps server field errors back
// onto the matching input, and renders success/error banners.
// Theme: proves the Light/Dark radio is hydrated from the persisted
// profile.theme (getProfile) and that saving calls upsertProfile({ theme }) so
// the selection survives a reload. Also guards the profile save: the server
// defaults a missing theme to 'dark', so a profile save must carry the theme.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from './SettingsPage';
import type { ChangePasswordResult } from './settingsApi';

// Control session state by mocking the Neon auth client (no network).
vi.mock('../auth/auth', () => ({
  authClient: {
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

// Mock the profile API so getProfile/upsertProfile are deterministic while the
// real sanitizeProfileLinks/uploadImage stay functional (used by handleSave).
const { getProfile, upsertProfile } = vi.hoisted(() => ({
  getProfile: vi.fn(),
  upsertProfile: vi.fn(),
}));

vi.mock('../../shared/api/profile', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../shared/api/profile')>();
  return {
    ...actual,
    getProfile,
    upsertProfile,
  };
});

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
import { changePassword, ProfileApiError } from './settingsApi';

type SessionResponse = Awaited<ReturnType<typeof authClient.getSession>>;

const authedSession = {
  data: { user: { id: '1', slug: 'k', name: 'Keerthi' }, session: { id: 's1', token: 'tok' } },
} as unknown as SessionResponse;

const lightProfile = {
  slug: 'k',
  displayName: 'Keerthi',
  bio: 'Missionary',
  photoUrl: null,
  theme: 'light',
  links: {},
};

const okResult: ChangePasswordResult = {
  success: true,
  message: 'Your password has been changed.',
};

beforeEach(() => {
  vi.mocked(authClient.getSession).mockResolvedValue(authedSession);
  getProfile.mockResolvedValue(lightProfile);
  upsertProfile.mockResolvedValue('k');
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

function renderSettings() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

describe('Settings → Appearance theme', () => {
  it('hydrates the Light/Dark radio from the persisted profile.theme', async () => {
    renderSettings();
    fireEvent.click(await screen.findByRole('button', { name: 'Appearance' }));

    // profile.theme is 'light' → the Light radio is the pressed one.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Light/ }).getAttribute('aria-pressed')).toBe('true');
    });
    expect(screen.getByRole('button', { name: /Dark/ }).getAttribute('aria-pressed')).toBe('false');
  });

  it('saves a theme flip via upsertProfile with the new theme', async () => {
    renderSettings();
    fireEvent.click(await screen.findByRole('button', { name: 'Appearance' }));
    fireEvent.click(await screen.findByRole('button', { name: /Light/ }));
    // Flip to Dark and save. The appearance save carries the full profile
    // payload (server replaces the row wholesale) with the theme included.
    fireEvent.click(screen.getByRole('button', { name: /Dark/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(upsertProfile).toHaveBeenCalledWith(
        expect.objectContaining({ theme: 'dark' }),
        'PUT',
      );
    });
    expect(await screen.findByText(/Saved/)).toBeTruthy();
  });

  it('profile save carries the current theme (server defaults to dark otherwise)', async () => {
    renderSettings();
    // Default section is Profile; theme hydrated as 'light' from getProfile.
    // Wait for the profile fetch to hydrate the form (enables the Save button).
    fireEvent.click(await screen.findByDisplayValue('Keerthi'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(upsertProfile).toHaveBeenCalledWith(
        expect.objectContaining({ theme: 'light' }),
        'PUT',
      );
    });
  });
});
