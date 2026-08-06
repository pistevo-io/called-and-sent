// API client for the profile + upload endpoints (Cloudflare Pages Functions).
//
// Wraps the VERIFIED contract in functions/api/profile.ts and functions/api/upload.ts
// — the source of truth for the API shape:
//   GET  /api/profile?slug=<handle>  -> public profile  { profile: ProfilePayload | null }
//   POST /api/profile                 -> upsert own profile (auth) -> { ok: true, slug }
//   PUT  /api/profile                 -> upsert own profile (auth) -> { ok: true, slug }
//   POST /api/upload                  -> upload image (auth) -> { key, url }
//
// Auth'd writes rely on the Better Auth session cookie: same-origin `fetch`
// sends it automatically, so no bearer token is attached here (matches how
// requireUser works on the backend and how trips.ts/wallPosts.ts do it).
//
// Note: profile write/update is keyed by the authenticated user, not by a slug
// in the URL. The backend derives the slug from the session (falling back to
// the body's slug / username / id), so `upsertProfile` sends a body and lets
// the server own the slug. `getProfile` (public read) is the only call that
// takes a slug in the path.
//
// Exported both as standalone functions (for direct/test imports) and as a
// `profileApi` object (mirroring the tripsApi / wallPostsApi convention used
// by DashboardPage.tsx).

export class ProfileApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ProfileApiError";
    this.status = status;
  }
}

/**
 * The four named slots of the profile links block — the cap is 4 by design
 * (website + socials + giving). Mirrors the API's server-owned vocabulary.
 */
export const PROFILE_LINK_KEYS = [
  'website',
  'instagram',
  'facebook',
  'giving',
] as const;

export type ProfileLinkKey = (typeof PROFILE_LINK_KEYS)[number];

/** A links block: only the four known keys, each holding a full URL string. */
export type ProfileLinks = Partial<Record<ProfileLinkKey, string>>;

/** Body for the POST/PUT upsert — the exact fields the backend accepts. */
export interface ProfileUpsert {
  slug?: string;
  displayName?: string;
  bio?: string;
  photoUrl?: string | null;
  theme?: string;
  links?: ProfileLinks | null;
}

/** Shape returned by GET /api/profile (display_name → displayName, etc.). */
export interface ProfilePayload {
  slug: string;
  displayName: string | null;
  bio: string | null;
  photoUrl: string | null;
  theme: string;
  links: ProfileLinks;
}

/**
 * Normalize a raw links map into a clean ProfileLinks object with only valid,
 * URL-shaped values under the known keys. Empty/whitespace entries are dropped,
 * unknown keys are ignored, and malformed URLs become null. Mirrors the
 * server-side sanitizer so the UI and the network layer agree on the shape.
 */
export function sanitizeProfileLinks(
  input: Record<string, unknown> | null | undefined,
): ProfileLinks {
  const links: ProfileLinks = {};
  for (const key of PROFILE_LINK_KEYS) {
    const value = input?.[key];
    if (typeof value !== 'string' || value.trim() === '') continue;
    let url: URL;
    try {
      url = new URL(value.trim());
    } catch {
      continue;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
    if (!url.hostname) continue;
    links[key] = url.toString();
  }
  return links;
}

/** Result of POST /api/upload — the stored R2 object key + its public URL. */
export interface UploadResult {
  key: string;
  url: string;
}

async function toError(res: Response): Promise<ProfileApiError> {
  let message = res.statusText;
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) message = body.error;
  } catch {
    // non-JSON error body; keep statusText
  }
  return new ProfileApiError(res.status, message);
}

/** Fetch a public profile by slug. Returns null when none exists (404). */
export async function getProfile(slug: string): Promise<ProfilePayload | null> {
  const res = await fetch(`/api/profile?slug=${encodeURIComponent(slug)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw await toError(res);
  }
  const data = (await res.json()) as { profile: ProfilePayload | null };
  return data.profile ?? null;
}

/** Upsert the caller's own profile (auth). Returns the persisted slug. */
export async function upsertProfile(
  body: ProfileUpsert,
  method: "POST" | "PUT" = "POST",
): Promise<string> {
  const res = await fetch(`/api/profile`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await toError(res);
  const data = (await res.json()) as { ok: true; slug: string };
  return data.slug;
}

/** Upload an image (auth). Returns the stored key + public url. */
export async function uploadImage(file: Blob): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`/api/upload`, { method: "POST", body: form });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as UploadResult;
}

/** Object wrapper mirroring the other API clients (tripsApi, wallPostsApi). */
export const profileApi = {
  getProfile,
  upsertProfile,
  uploadImage,
};
