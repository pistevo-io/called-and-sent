import { useMemo } from 'react';
import { missionaries } from './missionaries';
import { missionTrips } from './missionTrips';
import type { MissionTrip } from '../types/MissionTrip';
import type { MissionaryProfile } from '../types/MissionaryProfile';

interface MissionaryProfileResult {
  profile: MissionaryProfile | null;
  missions: MissionTrip[];
  loading: boolean;
  error: string | null;
}

/**
 * Resolves a missionary's public profile (and their trips) by slug.
 *
 * Today the data is local/static, so `loading` is always false and `error`
 * is only set when no profile matches. The shape is intentionally async-ready
 * so a future API-backed implementation can flip `loading`/`error` without
 * touching the consuming components.
 */
export function useMissionaryProfile(slug?: string): MissionaryProfileResult {
  return useMemo(() => {
    const profile = slug
      ? missionaries.find((m) => m.slug === slug) ?? null
      : missionaries[0] ?? null;

    if (!profile) {
      return {
        profile: null,
        missions: [],
        loading: false,
        error: 'Profile not found.',
      };
    }

    // The seed data has a single missionary, so every trip is attributed to
    // them. When multi-missionary support lands, filter by `mission.missionarySlug`.
    return { profile, missions: missionTrips, loading: false, error: null };
  }, [slug]);
}
