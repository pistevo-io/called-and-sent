import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EditorDashboard from './EditorDashboard';
import { authClient } from '../../features/auth/auth';
import * as store from './store';
import { EMPTY_PROFILE } from './types';

// framer-motion's AnimatePresence mode="wait" blocks the incoming panel until
// the outgoing one's exit animation resolves, which never happens in jsdom.
// Render motion elements as plain DOM and AnimatePresence as a passthrough so
// tab swaps are synchronous under test.
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    { get: (_t, tag: string) => (props: Record<string, unknown>) =>
      React.createElement(tag, props, (props as { children?: React.ReactNode }).children) },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock('../../features/auth/auth', () => ({
  authClient: {
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

vi.mock('./store', () => ({
  getProfile: vi.fn(),
  saveProfile: vi.fn(),
  getTrips: vi.fn(),
  saveTrips: vi.fn(),
  getWallPosts: vi.fn(),
  saveWallPosts: vi.fn(),
}));

const mockedAuth = authClient as unknown as {
  getSession: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
};
const mockedStore = store as unknown as {
  getProfile: ReturnType<typeof vi.fn>;
  getTrips: ReturnType<typeof vi.fn>;
  getWallPosts: ReturnType<typeof vi.fn>;
  saveProfile: ReturnType<typeof vi.fn>;
  saveTrips: ReturnType<typeof vi.fn>;
  saveWallPosts: ReturnType<typeof vi.fn>;
};

const renderDash = () =>
  render(
    <MemoryRouter>
      <EditorDashboard />
    </MemoryRouter>,
  );

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockedAuth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
  mockedStore.getProfile.mockResolvedValue(EMPTY_PROFILE);
  mockedStore.getTrips.mockResolvedValue([]);
  mockedStore.getWallPosts.mockResolvedValue([]);
  mockedStore.saveProfile.mockResolvedValue(undefined);
  mockedStore.saveTrips.mockResolvedValue(undefined);
  mockedStore.saveWallPosts.mockResolvedValue(undefined);
});

describe('EditorDashboard', () => {
  it('redirects to the sign-in screen when there is no session', async () => {
    mockedAuth.getSession.mockResolvedValue({ data: { session: null } });
    renderDash();
    await waitFor(() => expect(mockedAuth.getSession).toHaveBeenCalled());
    expect(
      screen.queryByRole('heading', { name: /missionary dashboard/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/sign in required/i)).toBeInTheDocument();
  });

  it('loads profile, trips, and wall then renders the dashboard with tabs', async () => {
    renderDash();
    expect(
      await screen.findByRole('heading', { name: /missionary dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /trips/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /wall/i })).toBeInTheDocument();
  });

  it('switches tabs when a tab is clicked', async () => {
    const user = userEvent.setup();
    renderDash();
    await screen.findByRole('heading', { name: /missionary dashboard/i });
    await user.click(screen.getByRole('tab', { name: /trips/i }));
    expect(screen.getByRole('heading', { name: /mission trips/i })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /wall/i }));
    expect(
      screen.getByRole('heading', { name: /prayer & testimony wall/i }),
    ).toBeInTheDocument();
  });

  it('signs out when the Sign out button is clicked', async () => {
    const user = userEvent.setup();
    mockedAuth.signOut.mockResolvedValue(undefined);
    renderDash();
    await screen.findByRole('heading', { name: /missionary dashboard/i });
    await user.click(screen.getByRole('button', { name: /sign out/i }));
    expect(mockedAuth.signOut).toHaveBeenCalled();
  });
});
