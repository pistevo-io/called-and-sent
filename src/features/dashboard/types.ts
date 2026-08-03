import type { MissionTrip } from '../../shared/types/MissionTrip';

export interface Profile {
  displayName: string;
  username: string;
  tagline: string;
  location: string;
  heroImageUrl: string;
  profileImageUrl: string;
  instagram: string;
  calling: string;
  testimony: string;
  ministryFocus: string[];
}

export type WallPostType = 'testimony' | 'prayer' | 'update' | 'praise' | 'scripture';

export interface WallPost {
  id: string;
  type: WallPostType;
  title: string;
  body: string;
  verseRef?: string;
  createdAt: string; // ISO 8601
}

/**
 * Thrown by the store boundary on parse / quota / write failures so callers
 * can distinguish storage errors from generic exceptions.
 */
export class StoreError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'StoreError';
    this.cause = cause;
  }
}

export const MINISTRY_OPTIONS = [
  'Evangelism',
  'Discipleship',
  'Children',
  'Medical',
  'Community Development',
  'Church Planting',
  'Refugee',
  'Translation',
] as const;

export const WALL_POST_TYPES: WallPostType[] = [
  'testimony',
  'prayer',
  'update',
  'praise',
  'scripture',
];

export const EMPTY_PROFILE: Profile = {
  displayName: '',
  username: '',
  tagline: '',
  location: '',
  heroImageUrl: '',
  profileImageUrl: '',
  instagram: '',
  calling: '',
  testimony: '',
  ministryFocus: [],
};

export function emptyWallPost(): WallPost {
  return {
    id: crypto.randomUUID(),
    type: 'update',
    title: '',
    body: '',
    verseRef: '',
    createdAt: new Date().toISOString(),
  };
}

export function emptyTrip(): MissionTrip {
  return {
    id: crypto.randomUUID(),
    location: '',
    country: '',
    coordinates: { lng: 0, lat: 0 },
    date: '',
    duration: '',
    title: '',
    description: '',
    story: '',
    images: [],
    highlights: [],
    peopleReached: undefined,
    ministryType: [],
    status: 'completed',
  };
}
