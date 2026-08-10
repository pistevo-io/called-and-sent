// Regression guard for the public missionary profile (/@slug).
//
// Proves the route is reachable by BOTH anonymous and authenticated visitors
// with zero redirect to /login, that the public (read-only) view hides owner
// edit controls (Add Trip), that the owner dashboard still shows them, and
// that truly auth-gated routes (/dashboard) remain gated.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProfileRouter from './ProfileRouter';
import DashboardPage from './DashboardPage';
import { RequireAuth } from '../auth/useAuthGuards';

// Control session state by mocking the Neon auth client (no network).
vi.mock('../auth/auth', () => ({
  authClient: {
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

// Control the profile API so the public card + theme render deterministically.
// Default: a persisted profile row (matches a real /@k). The Not Found tests
// override getProfile to null; the theme tests override with light/dark rows.
function makeProfile(overrides: Partial<ProfilePayload> = {}): ProfilePayload {
  return {
    slug: 'k',
    displayName: 'Keerthi',
    bio: 'Missionary',
    photoUrl: null,
    theme: 'dark',
    links: {},
    ...overrides,
  };
}

const { getProfile } = vi.hoisted(() => ({ getProfile: vi.fn() }));
vi.mock('../../shared/api/profile', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../shared/api/profile')>();
  return { ...actual, getProfile };
});

import { authClient } from '../auth/auth';
import type { ProfilePayload } from '../../shared/api/profile';

// Mock the trips/wall-posts API so slug normalization is asserted
// deterministically (the public page fetches by the CLEANED slug).
const { getTrips, getWallPosts } = vi.hoisted(() => ({
  getTrips: vi.fn().mockResolvedValue([]),
  getWallPosts: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../shared/api/trips', () => ({ tripsApi: { getTrips, createTrip: vi.fn(), updateTrip: vi.fn(), deleteTrip: vi.fn() } }));
vi.mock('../../shared/api/wallPosts', () => ({ wallPostsApi: { getWallPosts, getOwnerPosts: vi.fn().mockResolvedValue([]), createPost: vi.fn(), updatePost: vi.fn(), deletePost: vi.fn() } }));

// The real Better Auth getSession response type is a large generated union
// (full Session/user columns). The public profile UI only reads user id/slug/
// name and session id, so fixtures narrow through `unknown` — never `any` —
// to keep the mock honest about the fields that matter.
type SessionResponse = Awaited<ReturnType<typeof authClient.getSession>>;

const anonSession = {
  data: { user: null, session: null },
  error: null,
} as unknown as SessionResponse;
const authedSession = {
  data: { user: { id: '1', slug: 'k', name: 'Keerthi' }, session: { id: 's1' } },
  error: null,
} as unknown as SessionResponse;

beforeEach(() => {
  vi.mocked(authClient.getSession).mockResolvedValue(anonSession);
  getProfile.mockResolvedValue(makeProfile());
  getTrips.mockResolvedValue([]);
  getWallPosts.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
});

function renderPublicProfile(initialPath = '/@k') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/:slug" element={<ProfileRouter />} />
        <Route path="/login" element={<div>LOGIN_PAGE_MARKER</div>} />
        <Route path="/dashboard" element={<div>DASHBOARD_PAGE_MARKER</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Public profile (/@slug)', () => {
  it('renders for ANON users with NO redirect to /login', async () => {
    renderPublicProfile('/@k');

    // Public content actually rendered — "My Trips" appears as both the tab
    // button and the trips section heading after the default trips tab.
    expect((await screen.findAllByText(/My Trips/)).length).toBeGreaterThan(0);
    // Critical: no login redirect occurred.
    expect(screen.queryByText('LOGIN_PAGE_MARKER')).toBeNull();
    // Public view hides owner-only edit controls.
    expect(screen.queryByText('Add Trip')).toBeNull();
    // Anon nav shows a login link (a link, not a gate).
    expect(screen.queryByText('Log in')).toBeTruthy();
  });

  it('renders for AUTHED users with NO redirect to /login', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue(authedSession);
    renderPublicProfile('/@k');

    expect((await screen.findAllByText(/My Trips/)).length).toBeGreaterThan(0);
    expect(screen.queryByText('LOGIN_PAGE_MARKER')).toBeNull();
    // Even an authed visitor sees the PUBLIC (read-only) view — no Add Trip.
    expect(screen.queryByText('Add Trip')).toBeNull();
    // Authed nav shows Sign Out.
    expect(screen.queryByText('Sign Out')).toBeTruthy();
  });

  it('loads trip data without a session (no session-dependent throw)', async () => {
    renderPublicProfile('/@k');
    const tripsTab = await screen.findByRole('button', { name: /My Trips/ });
    fireEvent.click(tripsTab);
    // Trips seeded from shared data + localStorage regardless of session.
    expect(await screen.findByText(/My Trips \(\d+\)/)).toBeTruthy();
  });

  it('normalizes the @-prefixed handle so data fetches use the bare slug', async () => {
    renderPublicProfile('/@k');
    // The API is keyed by the bare slug ('k') — the leading '@' must be
    // stripped before getTrips/getWallPosts run, or the page shows empty data.
    await waitFor(() => expect(getTrips).toHaveBeenCalledWith('k'));
    await waitFor(() => expect(getWallPosts).toHaveBeenCalledWith('k'));
    expect(getTrips).not.toHaveBeenCalledWith('@k');
    expect(getWallPosts).not.toHaveBeenCalledWith('@k');
  });
});

describe('Unknown profile slug → Not Found (dogfood M1)', () => {
  it('renders a clear Not Found state instead of a plausible empty profile', async () => {
    // API 404: no profile row, no trips, no wall posts for this slug.
    getProfile.mockResolvedValue(null);
    renderPublicProfile('/definitely-not-a-user');

    expect(
      await screen.findByRole('heading', { name: 'Profile Not Found' }),
    ).toBeTruthy();
    // The old fake profile must NOT render.
    expect(screen.queryByText('No bio shared yet.')).toBeNull();
    expect(screen.queryByText(/No trips yet/)).toBeNull();
    // The Partner-With-Me FAB is hidden on a dead link.
    expect(screen.queryByRole('button', { name: /Partner With Me/i })).toBeNull();
    // A way home exists.
    expect(screen.getByRole('link', { name: 'Back to Home' })).toBeTruthy();
  });

  it('still renders when the slug has trips even if the profile row is missing', async () => {
    // Data anomaly: content exists but no profile row. Must NOT 404 — the
    // page keeps the slug-name fallback so the trips remain visible.
    getProfile.mockResolvedValue(null);
    getTrips.mockResolvedValue([
      {
        id: 't1',
        location: 'Manila',
        country: 'Philippines',
        coordinates: { lng: 120.98, lat: 14.6 },
        date: '2026-03-01',
        duration: '2 weeks',
        title: 'Philippines 2026',
        description: '',
        story: '',
        images: [],
        highlights: [],
        ministryType: [],
        status: 'upcoming',
      },
    ]);
    renderPublicProfile('/@k');

    expect(await screen.findByText('Philippines 2026')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Profile Not Found' })).toBeNull();
  });

  it('does NOT 404 on a transient API error (keeps slug-name fallback)', async () => {
    // Network blip: getProfile rejects, so the profile is not proven missing.
    // The page must keep rendering (slug fallback), never a false 404.
    getProfile.mockRejectedValue(new Error('network down'));
    renderPublicProfile('/@k');

    expect(await screen.findByText(/My Trips \(\d+\)/)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Profile Not Found' })).toBeNull();
  });
});

describe('Owner dashboard vs public view', () => {
  it('owner (authed) dashboard shows the Add Trip edit control', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue(authedSession);
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(await screen.findByText('Add Trip')).toBeTruthy();
  });

  it('public view hides Add Trip even when the visitor is authed', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue(authedSession);
    render(
      <MemoryRouter>
        <DashboardPage publicView defaultTab="trips" />
      </MemoryRouter>
    );
    await screen.findByText(/My Trips \(\d+\)/);
    expect(screen.queryByText('Add Trip')).toBeNull();
  });
});

describe('Auth-gated routes remain gated', () => {
  it('anon hitting /dashboard is redirected to /login', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue(anonSession);
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div>LOGIN_PAGE_MARKER</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText('LOGIN_PAGE_MARKER')).toBeTruthy();
  });
});

describe('Public profile theme render (profile.theme)', () => {
  it('renders the LIGHT page surfaces when the profile theme is light', async () => {
    getProfile.mockResolvedValue({
      slug: 'k',
      displayName: 'Keerthi',
      bio: 'Missionary',
      photoUrl: null,
      theme: 'light',
      links: {},
    });
    const { container } = renderPublicProfile('/@k');

    await screen.findByText('Keerthi');
    // ProfilePage wraps DashboardPage; the LAST .min-h-screen is the inner
    // DashboardPage root, which flips to the BRAND.md light background
    // (Faith Cream) and dark text instead of the dark shell.
    const roots = container.querySelectorAll('.min-h-screen');
    const pageRoot = roots[roots.length - 1];
    expect(pageRoot.className).toContain('bg-faith-cream');
    expect(pageRoot.className).toContain('text-gray-900');
  });

  it('renders the DARK page surfaces by default (or theme dark)', async () => {
    getProfile.mockResolvedValue({
      slug: 'k',
      displayName: 'Keerthi',
      bio: null,
      photoUrl: null,
      theme: 'dark',
      links: {},
    });
    const { container } = renderPublicProfile('/@k');

    await screen.findByText('Keerthi');
    const roots = container.querySelectorAll('.min-h-screen');
    const pageRoot = roots[roots.length - 1];
    expect(pageRoot.className).toContain('bg-gray-900');
    expect(pageRoot.className).toContain('text-white');
  });
});
