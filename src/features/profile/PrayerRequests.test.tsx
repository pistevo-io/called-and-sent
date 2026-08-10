// Prayer Requests section on the public missionary profile (/@slug).
//
// Design decision (kanban t_06589a52): the section REUSES the wall's published
// Prayer posts — no separate schema or form. These tests prove:
//   1. <PrayerRequests> in isolation: heading, prayer-only filtering
//      (non-prayer types and drafts excluded), loading + empty states.
//   2. Integration through the public profile route: a published prayer post
//      from the mocked wall API surfaces under "Prayer Requests" on /@slug,
//      and the owner dashboard does NOT show the section.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrayerRequests from './PrayerRequests';
import ProfileRouter from './ProfileRouter';
import DashboardPage from './DashboardPage';
import type { WallPost } from '../../shared/types/WallPost';

// Control session state by mocking the Neon auth client (matches the public
// profile regression pattern — no network).
vi.mock('../auth/auth', () => ({
  authClient: {
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

// Deterministic public wall reads (the section consumes published posts).
vi.mock('../../shared/api/wallPosts', () => ({
  wallPostsApi: {
    getOwnerPosts: vi.fn(),
    getWallPosts: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    transitionPost: vi.fn(),
    deletePost: vi.fn(),
  },
}));

// Trips + profile reads stay quiet in the integration path (no network).
vi.mock('../../shared/api/trips', () => ({
  tripsApi: {
    getTrips: vi.fn(),
    createTrip: vi.fn(),
    updateTrip: vi.fn(),
    deleteTrip: vi.fn(),
  },
}));

vi.mock('../../shared/api/profile', () => ({
  getProfile: vi.fn(),
  uploadImage: vi.fn(),
}));

import { authClient } from '../auth/auth';
import { wallPostsApi } from '../../shared/api/wallPosts';
import { tripsApi } from '../../shared/api/trips';
import { getProfile } from '../../shared/api/profile';

const anonSession = { data: { user: null, session: null } };
const authedSession = {
  data: { user: { id: '1', slug: 'k', name: 'Keerthi' }, session: { id: 's1' } },
};

const prayerPost: WallPost = {
  id: 'pr1', title: 'Pray for our team', content: 'Travel mercies for the village trip.',
  date: '2026-08-05', status: 'published', postType: 'prayer',
};
const updatePost: WallPost = {
  id: 'up1', title: 'Update from the field', content: 'The clinic opened.',
  date: '2026-08-04', status: 'published', postType: 'update',
};
const draftPrayer: WallPost = {
  id: 'dr1', title: 'Draft prayer', content: 'Not yet public.',
  date: '2026-08-03', status: 'draft', postType: 'prayer',
};

beforeEach(() => {
  vi.mocked(authClient.getSession).mockResolvedValue(anonSession);
  vi.mocked(wallPostsApi.getWallPosts).mockResolvedValue([prayerPost]);
  vi.mocked(tripsApi.getTrips).mockResolvedValue([]);
  vi.mocked(getProfile).mockResolvedValue(null);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PrayerRequests (isolated)', () => {
  it('renders the heading and a published prayer post', () => {
    render(<PrayerRequests posts={[prayerPost]} loading={false} />);

    expect(screen.getByRole('heading', { name: 'Prayer Requests' })).toBeTruthy();
    expect(screen.getByText('Pray for our team')).toBeTruthy();
  });

  it('shows only published Prayer posts (non-prayer types and drafts excluded)', () => {
    render(
      <PrayerRequests posts={[prayerPost, updatePost, draftPrayer]} loading={false} />,
    );

    expect(screen.getByText('Pray for our team')).toBeTruthy();
    expect(screen.queryByText('Update from the field')).toBeNull();
    expect(screen.queryByText('Draft prayer')).toBeNull();
  });

  it('shows the empty state when there are no published prayer posts', () => {
    render(<PrayerRequests posts={[updatePost, draftPrayer]} loading={false} />);

    expect(screen.getByText(/no prayer requests yet/i)).toBeTruthy();
  });

  it('shows the loading state while the wall fetch is in flight', () => {
    render(<PrayerRequests posts={[]} loading />);

    expect(screen.getByText(/loading prayer requests/i)).toBeTruthy();
  });
});

describe('Prayer Requests on the public profile (/@slug)', () => {
  it('renders published prayer posts from the wall API under the section', async () => {
    render(
      <MemoryRouter initialEntries={['/@k']}>
        <Routes>
          <Route path="/:slug" element={<ProfileRouter />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Prayer Requests' }),
    ).toBeTruthy();
    // The published prayer post (from the mocked wall API) surfaces here.
    expect(await screen.findByText('Pray for our team')).toBeTruthy();
  });

  it('does not render the section on the owner dashboard', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue(authedSession);
    vi.mocked(wallPostsApi.getOwnerPosts).mockResolvedValue([prayerPost]);

    render(
      <MemoryRouter>
        <DashboardPage defaultTab="wall" />
      </MemoryRouter>,
    );

    // Owner dashboard: the wall tab owns posts; no standalone prayer section.
    expect(await screen.findByRole('button', { name: /Wall Posts/ })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Prayer Requests' })).toBeNull();
  });
});
