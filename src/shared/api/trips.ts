// API client for the trip endpoints (Cloudflare Pages Functions).
//
// This wraps the verified contract in functions/api/trips.ts — the source of
// truth for the API shape:
//   GET    /api/trips?slug=<handle>  -> public list  { trips: TripDTO[] }
//   POST   /api/trips                -> create (auth) -> { id }
//   PUT    /api/trips?id=<tripId>    -> update (auth) -> { ok: true }
//   DELETE /api/trips?id=<tripId>    -> delete (auth) -> { ok: true }
//
// Auth'd writes rely on the Better Auth session cookie: same-origin `fetch`
// sends it automatically, so no bearer token is attached here (matches how
// change-password.ts and requireUser work on the backend).
//
// The backend returns trips in camelCase (see rowToTrip in trips.ts). Trips
// come back in the exact shape the UI already expects, with two defensive
// coercions to keep the frontend MissionTrip type contract satisfied even when
// a row has a nullable coordinate/date.

import type { MissionTrip } from "../types/MissionTrip";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Raw trip shape as returned by GET /api/trips (mirrors rowToTrip). */
interface TripDTO {
  id: string;
  title: string;
  location: string | null;
  country: string | null;
  coordinates: { lng?: number; lat?: number } | null;
  date: string | null;
  duration: string | null;
  description: string | null;
  story: string | null;
  images: string[];
  highlights: string[];
  peopleReached?: number;
  ministryType: string[];
  status: "completed" | "upcoming";
}

function mapTrip(raw: TripDTO): MissionTrip {
  return {
    id: raw.id,
    title: raw.title ?? "",
    location: raw.location ?? "",
    country: raw.country ?? "",
    // MissionTrip requires a non-null coordinate object; the DB row can be null.
    coordinates: raw.coordinates
      ? { lng: raw.coordinates.lng ?? 0, lat: raw.coordinates.lat ?? 0 }
      : { lng: 0, lat: 0 },
    // MissionTrip.date is a required string; never hand the UI null.
    date: raw.date ?? "",
    duration: raw.duration ?? "",
    description: raw.description ?? "",
    story: raw.story ?? "",
    images: raw.images ?? [],
    highlights: raw.highlights ?? [],
    peopleReached: raw.peopleReached,
    ministryType: raw.ministryType ?? [],
    status: raw.status ?? "upcoming",
  };
}

export async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body; keep statusText
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

export const tripsApi = {
  /** Public list of trips for a profile handle. No auth required. */
  async getTrips(slug: string): Promise<MissionTrip[]> {
    const data = await jsonRequest<{ trips: TripDTO[] }>(
      `/api/trips?slug=${encodeURIComponent(slug)}`,
    );
    return (data.trips ?? []).map(mapTrip);
  },

  /** Create a trip (auth). Returns the new trip id. */
  async createTrip(trip: MissionTrip): Promise<string> {
    const data = await jsonRequest<{ id: string }>("/api/trips", {
      method: "POST",
      body: JSON.stringify(trip),
    });
    return data.id;
  },

  /** Update a trip (auth). */
  async updateTrip(id: string, trip: MissionTrip): Promise<void> {
    await jsonRequest<{ ok: true }>(`/api/trips?id=${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(trip),
    });
  },

  /** Delete a trip (auth). */
  async deleteTrip(id: string): Promise<void> {
    await jsonRequest<{ ok: true }>(`/api/trips?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};
