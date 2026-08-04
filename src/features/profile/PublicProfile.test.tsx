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

const anonSession = { data: { user: null, session: null } };
const authedSession = {
  data: { user: { id: '1', slug: 'k', name: 'Keerthi' }, session: { id: 's1' } },
};

beforeEach(() => {
  vi.mocked(authClient.getSession).mockResolvedValue(anonSession as any);
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

    // Public content actually rendered (tab bar with My Trips).
    expect(await screen.findByText(/My Trips/)).toBeTruthy();
    // Critical: no login redirect occurred.
    expect(screen.queryByText('LOGIN_PAGE_MARKER')).toBeNull();
    // Public view hides owner-only edit controls.
    expect(screen.queryByText('Add Trip')).toBeNull();
    // Anon nav shows a login link (a link, not a gate).
    expect(screen.queryByText('Log in')).toBeTruthy();
  });

  it('renders for AUTHED users with NO redirect to /login', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue(authedSession as any);
    renderPublicProfile('/@k');

    expect(await screen.findByText(/My Trips/)).toBeTruthy();
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
    vi.mocked(authClient.getSession).mockResolvedValue(authedSession as any);
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(await screen.findByText('Add Trip')).toBeTruthy();
  });

  it('public view hides Add Trip even when the visitor is authed', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue(authedSession as any);
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
    vi.mocked(authClient.getSession).mockResolvedValue(anonSession as any);
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
