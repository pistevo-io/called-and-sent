import { authClient } from './auth';
import type { SessionUser } from './authHooks';

/**
 * Resolve the logged-in user's profile slug for use in nav/profile links.
 * Better Auth stores the handle under `slug` or `username` depending on the
 * configured plugin; fall back to the example slug `k` (`/@k`) otherwise so the
 * link is never broken.
 */
export function resolveProfileSlug(user: SessionUser | null): string {
  const raw = user?.slug ?? user?.username ?? 'k';
  return String(raw);
}

/**
 * Sign the current user out via Neon Auth, then force a full reload to the
 * landing page. The reload clears the Better Auth client-side session cache and
 * flips the auth-aware nav back to the logged-out state.
 */
export async function signOut(): Promise<void> {
  await authClient.signOut();
  // Full reload (not a SPA navigate) so cached session state is discarded.
  window.location.assign('/');
}
