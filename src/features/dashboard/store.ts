import type { MissionTrip } from '../../shared/types/MissionTrip';
import { missionTrips } from '../../shared/data/missionTrips';
import { StoreError, EMPTY_PROFILE } from './types';
import type { Profile, WallPost } from './types';

/**
 * localStorage-backed persistence boundary shaped like an async API client.
 * Every method returns a Promise so this module can be swapped for a Neon
 * client later without touching the UI. Falls back to an in-memory store when
 * localStorage is unavailable (SSR, privacy mode, quota). Throws StoreError on
 * read/write/parse failures so callers can handle storage problems distinctly.
 */

const KEYS = {
  profile: 'cas.profile',
  trips: 'cas.trips',
  wall: 'cas.wall',
} as const;

// In-memory fallback used when localStorage is unavailable or throws.
const memory = new Map<string, string>();

function storageAvailable(): boolean {
  try {
    const probe = '__cas_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const HAS_STORAGE = typeof window !== 'undefined' && storageAvailable();

function readRaw(key: string): string | null {
  if (HAS_STORAGE) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      throw new StoreError(`Failed to read from storage: ${key}`, err);
    }
  }
  return memory.get(key) ?? null;
}

function writeRaw(key: string, value: string): void {
  if (HAS_STORAGE) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      throw new StoreError(`Failed to write to storage: ${key}`, err);
    }
    return;
  }
  memory.set(key, value);
}

function parseOrNull<T>(key: string): T | null {
  const raw = readRaw(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new StoreError(`Corrupt data for ${key}`, err);
  }
}

// ---- Profile ----

export async function getProfile(): Promise<Profile> {
  const stored = parseOrNull<Profile>(KEYS.profile);
  return stored ?? EMPTY_PROFILE;
}

export async function saveProfile(profile: Profile): Promise<void> {
  if (!profile.username) {
    throw new StoreError('Username is required to save profile');
  }
  writeRaw(KEYS.profile, JSON.stringify(profile));
}

// ---- Trips ----

let tripsSeeded = false;

function getAllTrips(): MissionTrip[] {
  const stored = parseOrNull<MissionTrip[]>(KEYS.trips);
  if (stored) return stored;
  // Seed from the static data set on first access.
  if (!tripsSeeded) {
    writeRaw(KEYS.trips, JSON.stringify(missionTrips));
    tripsSeeded = true;
  }
  return missionTrips;
}

export async function getTrips(): Promise<MissionTrip[]> {
  return getAllTrips();
}

export async function saveTrips(trips: MissionTrip[]): Promise<void> {
  writeRaw(KEYS.trips, JSON.stringify(trips));
}

// ---- Wall posts ----

export async function getWallPosts(): Promise<WallPost[]> {
  const stored = parseOrNull<WallPost[]>(KEYS.wall);
  return stored ?? [];
}

export async function saveWallPosts(posts: WallPost[]): Promise<void> {
  writeRaw(KEYS.wall, JSON.stringify(posts));
}
