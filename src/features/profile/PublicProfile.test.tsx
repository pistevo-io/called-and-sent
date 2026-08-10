// Regression guard for the public missionary profile (/@slug).
//
// Proves the route is reachable by BOTH anonymous and authenticated visitors
// with zero redirect to /login, that the public (read-only) view hides owner
// edit controls (Add Trip), that the owner dashboard still shows them, and
// that truly auth-gated routes (/dashboard) remain gated.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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

import { authClient } from '../auth/auth';

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
