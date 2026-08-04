import { beforeEach, describe, expect, it } from 'vitest';
import {
  getProfile,
  saveProfile,
  getTrips,
  saveTrips,
  getWallPosts,
  saveWallPosts,
} from './store';
import { EMPTY_PROFILE, StoreError, type Profile, type WallPost } from './types';

describe('store — profile persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns EMPTY_PROFILE when nothing is stored', async () => {
    const result = await getProfile();
    expect(result).toEqual(EMPTY_PROFILE);
  });

  it('round-trips a saved profile through localStorage', async () => {
    const profile: Profile = {
      ...EMPTY_PROFILE,
      username: 'jane-doe',
      displayName: 'Jane Doe',
      tagline: 'Sharing hope in Honduras',
      ministryFocus: ['Medical', 'Evangelism'],
    };
    await saveProfile(profile);
    const loaded = await getProfile();
    expect(loaded).toEqual(profile);
  });

  it('throws StoreError when saving a profile with no username', async () => {
    const noUsername: Profile = { ...EMPTY_PROFILE, displayName: 'No Name' };
    await expect(saveProfile(noUsername)).rejects.toBeInstanceOf(StoreError);
  });

  it('throws StoreError when stored profile JSON is unparseable', async () => {
    window.localStorage.setItem('cas.profile', '{not valid json');
    await expect(getProfile()).rejects.toBeInstanceOf(StoreError);
  });
});

describe('store — trips persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('seeds from static missionTrips data on first access and persists the seed', async () => {
    const trips = await getTrips();
    expect(trips.length).toBeGreaterThan(0);
    // The seed should have been written to storage so subsequent reads are stable.
    expect(window.localStorage.getItem('cas.trips')).not.toBeNull();
  });

  it('reads stored trips over the static seed (storage is the source of truth)', async () => {
    // An emptied-out saved list must win over the baked-in seed data.
    await saveTrips([]);
    const loaded = await getTrips();
    expect(loaded).toEqual([]);
  });

  it('round-trips saved trips', async () => {
    const custom = [
      {
        id: 'trip-1',
        location: 'Guaimaca',
        country: 'Honduras',
        coordinates: { lng: -85.5, lat: 14.9 },
        date: 'September 2026',
        duration: '1 week',
        title: 'Medical Mission',
        description: 'Clinic days',
        story: 'Full story',
        images: ['https://example.com/a.jpg'],
        highlights: ['first baptism'],
        peopleReached: 120,
        ministryType: ['Medical'],
        status: 'completed' as const,
      },
    ];
    await saveTrips(custom);
    const loaded = await getTrips();
    expect(loaded).toEqual(custom);
  });
});

describe('store — wall posts persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns an empty array when no wall posts are stored', async () => {
    expect(await getWallPosts()).toEqual([]);
  });

  it('round-trips an array of wall posts', async () => {
    const posts: WallPost[] = [
      {
        id: 'post-1',
        type: 'testimony',
        title: 'God provided',
        body: 'Details here',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    await saveWallPosts(posts);
    expect(await getWallPosts()).toEqual(posts);
  });

  it('throws StoreError when stored wall JSON is corrupt', async () => {
    window.localStorage.setItem('cas.wall', '{not valid json');
    await expect(getWallPosts()).rejects.toBeInstanceOf(StoreError);
  });
});
