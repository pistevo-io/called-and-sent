import { useCallback } from 'react';

export interface ChromeGuardOptions {
  /** true for layout pages that legitimately render one <header>; false for chrome-free content. */
  expectHeader: boolean;
  /** Same semantics for <footer>. */
  expectFooter: boolean;
}

/**
 * Dev-only guard against duplicate or misplaced page chrome (header/footer).
 *
 * Attach the returned ref callback to the component's ROOT element so the
 * check is scoped to that component's OWN subtree (not the whole document).
 * This lets a chrome-free content component (e.g. DashboardPage, only ever
 * mounted inside ProfilePage) assert it renders no header/footer, catching the
 * "duplicate header/footer on the profile page" regression at runtime in dev
 * instead of in production.
 *
 *   expectHeader: false -> throws if the subtree contains any <header>
 *   expectHeader: true  -> throws only if the subtree contains > 1 <header>
 *   (identical rules for <footer>)
 *
 * The check runs inside the ref callback, which React invokes after the real
 * DOM node (and its children) are committed. This matters for components that
 * render a loading state first and swap to the real tree afterwards (e.g.
 * DashboardPage's `checking` spinner): the ref is attached only to the real
 * root, so the guard inspects the final chrome, not the placeholder.
 *
 * No-op outside development (import.meta.env.DEV === false) — fully
 * tree-shaken from production builds.
 */
export function useChromeGuard(
  componentName: string,
  { expectHeader, expectFooter }: ChromeGuardOptions
): (node: HTMLElement | null) => void {
  const check = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;
      if (!import.meta.env.DEV) return;

      const headers = node.querySelectorAll('header');
      const footers = node.querySelectorAll('footer');

      if (!expectHeader && headers.length > 0) {
        throw new Error(
          `[useChromeGuard] ${componentName} must be chrome-free but rendered ${headers.length} <header>. ` +
            'Move page chrome to the parent layout.'
        );
      }
      if (expectHeader && headers.length > 1) {
        throw new Error(
          `[useChromeGuard] ${componentName} rendered ${headers.length} <header>s; expected exactly one.`
        );
      }

      if (!expectFooter && footers.length > 0) {
        throw new Error(
          `[useChromeGuard] ${componentName} must be chrome-free but rendered ${footers.length} <footer>. ` +
            'Move page chrome to the parent layout.'
        );
      }
      if (expectFooter && footers.length > 1) {
        throw new Error(
          `[useChromeGuard] ${componentName} rendered ${footers.length} <footer>s; expected exactly one.`
        );
      }
    },
    [componentName, expectHeader, expectFooter]
  );

  return useCallback((node: HTMLElement | null) => check(node), [check]);
}
