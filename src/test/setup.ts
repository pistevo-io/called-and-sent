// Global test setup: jest-dom matchers + jsdom polyfills the components rely on.
import '@testing-library/jest-dom/vitest';

// crypto.randomUUID is used by the domain factories (emptyWallPost/emptyTrip).
// jsdom may not expose a fully-featured crypto object, so fall back to Node's.
import { webcrypto } from 'node:crypto';
if (!(globalThis as { crypto?: Crypto }).crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}

// Minimal ResizeObserver stub for framer-motion layout animations.
if (!globalThis.ResizeObserver) {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// rAF polyfill (jsdom sometimes lacks it; framer-motion schedules on it).
if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 0) as unknown as number) as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number) =>
    clearTimeout(id)) as typeof cancelAnimationFrame;
}

// matchMedia stub (used by some UI primitives / responsive hooks).
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// scrollIntoView is called by focus management but is a no-op in jsdom.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
