/**
 * Resolve the canonical share URL.
 * Prefer an explicit `url` prop; otherwise fall back to the current page.
 * The `typeof window !== 'undefined'` guard keeps this safe during SSR
 * (server render) where `window` does not exist — it returns '' there.
 */
export function resolveShareUrl(url?: string): string {
  return url ?? (typeof window !== 'undefined' ? window.location.href : '');
}

/**
 * Build an absolute, canonical share URL for an in-app route/path.
 *
 * Strips query strings and hash fragments (which `window.location.href`
 * would otherwise include) so shared links point at the clean resource route.
 * SSR-safe: returns '' when `window` is unavailable (server render).
 *
 * `path` is the in-app path only (e.g. '/dashboard' or window.location.pathname);
 * the current origin is prepended automatically.
 */
export function canonicalUrl(path: string): string {
  if (typeof window === 'undefined') return '';
  const clean = '/' + path.replace(/^\/+/, '').replace(/\/+$/, '');
  return `${window.location.origin}${clean}`;
}
