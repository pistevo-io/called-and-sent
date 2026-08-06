// Public profile links block regression guard.
//
// Proves the public (/@slug) read-only profile card renders the links block:
// entries present on the profile are shown as icon buttons with the correct
// external href, and a profile with no links falls back to "No links shared yet."
// The profile API module is mocked so the card renders deterministically.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProfileRouter from './ProfileRouter';
import { getProfile } from '../../shared/api/profile';

// Control session state by mocking the Neon auth client (no network).
vi.mock('../auth/auth', () => ({
  authClient: {
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

// Deterministic profile payload with links — no network, no backend.
vi.mock('../../shared/api/profile', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../shared/api/profile')>();
  return {
    ...actual,
    getProfile: vi.fn(),
  };
});

import { authClient } from '../auth/auth';
import type { ProfilePayload } from '../../shared/api/profile';

type SessionResponse = {
  data: { user: unknown; session: unknown };
};

const anonSession: SessionResponse = { data: { user: null, session: null } };

function makeProfile(links: ProfilePayload['links']): ProfilePayload {
  return {
    slug: 'k',
    displayName: 'Keerthi',
    bio: 'Missionary',
    photoUrl: null,
    theme: 'dark',
    links,
  };
}

beforeEach(() => {
  vi.mocked(authClient.getSession).mockResolvedValue(anonSession as never);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderPublicProfile() {
  return render(
    <MemoryRouter initialEntries={['/@k']}>
      <Routes>
        <Route path="/:slug" element={<ProfileRouter />} />
        <Route path="/login" element={<div>LOGIN_PAGE_MARKER</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Public profile links block', () => {
  it('renders present links as external icon buttons with the right hrefs', async () => {
    vi.mocked(getProfile).mockResolvedValue(
      makeProfile({
        website: 'https://example.org/',
        instagram: 'https://instagram.com/keerthi',
      }),
    );

    renderPublicProfile();

    const linksBlock = await screen.findByTestId('public-profile-links');

    const website = within(linksBlock).getByRole('link', { name: 'Website' });
    expect(website.getAttribute('href')).toBe('https://example.org/');
    expect(website.getAttribute('target')).toBe('_blank');
    expect(website.getAttribute('rel') ?? '').toContain('noopener');

    const instagram = within(linksBlock).getByRole('link', { name: 'Instagram' });
    expect(instagram.getAttribute('href')).toBe('https://instagram.com/keerthi');

    // Only present links render — nothing for Facebook or Give.
    expect(within(linksBlock).queryByRole('link', { name: 'Facebook' })).toBeNull();
    expect(within(linksBlock).queryByRole('link', { name: 'Give' })).toBeNull();
    expect(screen.queryByText('No links shared yet.')).toBeNull();
  });

  it('shows the empty fallback when the profile has no links', async () => {
    vi.mocked(getProfile).mockResolvedValue(makeProfile({}));

    renderPublicProfile();

    expect(await screen.findByText('No links shared yet.')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Website' })).toBeNull();
  });
});
