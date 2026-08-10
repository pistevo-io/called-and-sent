// Dogfood L6 regression guard: the Neon Auth UI provider bundles next-themes,
// which injects a theme script that writes a theme class + color-scheme onto
// <html>. Previously the default was "system", so light-OS browsers got
// <html class="light"> + color-scheme: light on a hardcoded dark UI. The app
// is dark-only (BRAND.md), so the provider must force defaultTheme="dark":
// html must never carry the "light" class and color-scheme must resolve dark.
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { NeonAuthUIProvider } from '@neondatabase/auth-ui';

// The theme script reads localStorage("theme"); clear it so defaultTheme wins.
beforeAll(() => {
  window.localStorage.clear();
  // jsdom lacks matchMedia; the provider's system-theme listener needs it.
  window.matchMedia = window.matchMedia || ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
});

vi.mock('./features/auth/auth', () => ({
  authClient: {
    getSession: vi.fn().mockResolvedValue({ data: { user: null, session: null } }),
    signOut: vi.fn(),
    // AuthUIProvider builds its hooks from the client; give it a session hook.
    useSession: () => ({ data: { user: null, session: null }, isPending: false }),
  },
}));

import { authClient } from './features/auth/auth';

function runThemeScript() {
  // next-themes renders a <script> via dangerouslySetInnerHTML that does not
  // auto-execute under jsdom; eval it in the window context to simulate the
  // real browser behavior.
  const scripts = Array.from(document.querySelectorAll('script'));
  const themeScript = scripts.find((s) => s.textContent?.includes('classList'));
  expect(themeScript, 'theme script injected by provider').toBeTruthy();
  window.eval(themeScript!.textContent!);
}

describe('Dark-only theme (dogfood L6)', () => {
  it('forces dark on <html> even when the OS prefers light', () => {
    render(
      <NeonAuthUIProvider authClient={authClient} defaultTheme="dark">
        <div />
      </NeonAuthUIProvider>,
    );

    runThemeScript();

    const html = document.documentElement;
    expect(html.classList.contains('light')).toBe(false);
    expect(html.classList.contains('dark')).toBe(true);
    expect(html.style.colorScheme).toBe('dark');
  });
});
