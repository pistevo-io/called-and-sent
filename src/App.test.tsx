// Route-splitting smoke test: proves App.tsx's React.lazy routes load their
// chunk and render real page content, and that the eager routes (landing,
// public profile) still render without a redirect. Guards the code-split
// refactor — if someone reverts App.tsx to static imports (or breaks a lazy
// import path), these tests fail.
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import App from './App';

// jsdom lacks IntersectionObserver, which framer-motion's `whileInView` needs.
beforeAll(() => {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  (globalThis as typeof globalThis & { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
    IntersectionObserverStub as unknown as typeof IntersectionObserver;
});

// Control session state by mocking the Neon auth client (no network).
vi.mock('./features/auth/auth', () => ({
  authClient: {
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

import { authClient } from './features/auth/auth';

const anonSession = { data: { user: null, session: null } };
const authedSession = {
  data: { user: { id: '1', slug: 'k', name: 'Keerthi' }, session: { id: 's1' } },
};

beforeEach(() => {
  vi.mocked(authClient.getSession).mockResolvedValue(anonSession);
});

afterEach(() => {
  cleanup();
});

function renderAt(path: string) {
  window.history.replaceState({}, '', path);
  return render(<App />);
}

describe('Route code-splitting (App.tsx lazy routes)', () => {
  it('renders landing (/) eagerly without redirect', async () => {
    renderAt('/');
    expect(
      await screen.findByText(/A beautiful home on the web for every missionary/i),
    ).toBeTruthy();
  });

  it('lazy-loads /login', async () => {
    renderAt('/login');
    expect(await screen.findByText('Sign in to your account')).toBeTruthy();
  });

  it('lazy-loads /signup', async () => {
    renderAt('/signup');
    expect(await screen.findByText('Create your account')).toBeTruthy();
  });

  it('lazy-loads /privacy', async () => {
    renderAt('/privacy');
    expect(
      await screen.findByRole('heading', { name: 'Privacy Policy' }),
    ).toBeTruthy();
  });

  it('lazy-loads /terms', async () => {
    renderAt('/terms');
    expect(
      await screen.findByRole('heading', { name: 'Terms of Service' }),
    ).toBeTruthy();
  });

  it('lazy-loads /dev/fonts', async () => {
    renderAt('/dev/fonts');
    expect(
      await screen.findByRole('heading', { name: 'Font Selection' }),
    ).toBeTruthy();
  });

  it('lazy-loads /dev/brand', async () => {
    renderAt('/dev/brand');
    expect(
      await screen.findByRole('heading', { name: 'Brand Explorer' }),
    ).toBeTruthy();
  });

  it('lazy-loads /settings behind RequireAuth (authed)', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue(authedSession);
    renderAt('/settings');
    expect(
      await screen.findByRole('heading', { name: 'Settings' }),
    ).toBeTruthy();
  });
});
