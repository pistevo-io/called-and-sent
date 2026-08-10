// Settings → Appearance: theme selection persistence.
//
// Proves the Light/Dark radio is hydrated from the persisted profile.theme
// (getProfile) and that saving calls upsertProfile({ theme }) so the selection
// survives a reload. Also guards the profile save: the server defaults a
// missing theme to 'dark', so a profile save must carry the theme along.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Control session state by mocking the Neon auth client (no network).
vi.mock('../auth/auth', () => ({
  authClient: {
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

// Mock the profile API so getProfile/upsertProfile are deterministic.
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

import { authClient } from '../auth/auth';

type SessionResponse = Awaited<ReturnType<typeof authClient.getSession>>;

const authedSession = {
  data: { user: { id: '1', slug: 'k', name: 'Keerthi' }, session: { id: 's1' } },
} as unknown as SessionResponse;

const lightProfile = {
  slug: 'k',
  displayName: 'Keerthi',
  bio: 'Missionary',
  photoUrl: null,
  theme: 'light',
  links: {},
};

beforeEach(() => {
  vi.mocked(authClient.getSession).mockResolvedValue(authedSession);
  getProfile.mockResolvedValue(lightProfile);
  upsertProfile.mockResolvedValue('k');
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderSettings() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>
  );
}

// Import after mocks are registered (vi.mock is hoisted anyway).
import SettingsPage from './SettingsPage';

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
