import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Isolated test config (does NOT load the production PWA plugin).
// Only front-end tests run here. Pages Functions worker tests live under
// functions/ and import `cloudflare:*` builtins — they require the dedicated
// vitest-pool-workers environment (vitest.workers.config.ts, `npm run test:api`)
// and are excluded here so a plain `npm run test` does not try to resolve
// `cloudflare:workers` and fail.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
