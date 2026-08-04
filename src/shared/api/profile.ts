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

/** Body for the POST/PUT upsert — the exact fields the backend accepts. */
export interface ProfileUpsert {
  slug?: string;
  displayName?: string;
  bio?: string;
  photoUrl?: string | null;
  theme?: string;
}

/** Shape returned by GET /api/profile (display_name → displayName, etc.). */
export interface ProfilePayload {
  slug: string;
  displayName: string | null;
  bio: string | null;
  photoUrl: string | null;
  theme: string;
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
