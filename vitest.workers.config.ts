import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { unstable_splitSqlQuery } from 'wrangler';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

// Build the D1 migrations array here in Node (NOT inside workerd — the worker
// sandbox has no filesystem). Vite's `define` inlines the resulting array as a
// JSON literal into the test bundle, so `applyD1Migrations` in the test just
// receives a plain array with no fs/wrangler dependency at runtime.
function buildMigrations(): { name: string; queries: string[] }[] {
  const dir = resolve('migrations');
  const names = readdirSync(dir)
    .filter((n) => n.endsWith('.sql'))
    .sort((a, b) => parseInt(a.split('_')[0], 10) - parseInt(b.split('_')[0], 10));
  return names.map((name) => ({
    name,
    queries: unstable_splitSqlQuery(readFileSync(join(dir, name), 'utf8')),
  }));
}

const migrations = buildMigrations();

// Runs the API/Pages-Functions tests (functions/**/*.test.ts) inside the
// workerd runtime via @cloudflare/vitest-pool-workers, using the real wrangler
// Pages config — so the `called_and_sent` D1 binding and functions routing
// match production.
//
// Invoked separately from the React (jsdom) suite via `npm run test:api`
// (`vitest run -c vitest.workers.config.ts`).
export default defineConfig({
  plugins: [
    cloudflareTest({
      // The compiled Pages Functions bundle is the worker entrypoint under test.
      // It is produced by `wrangler pages functions build` (see the `test:api`
      // script). Bindings (D1, R2) come from wrangler.jsonc via configPath.
      main: './dist/index.js',
      wrangler: { configPath: './wrangler.jsonc' },
      // NOTE: Better Auth's base URL (`env.BETTER_AUTH_URL`) is intentionally
      // NOT injected. Pages handlers read env from the wrangler config, and
      // `miniflare.vars` does not propagate to the Pages `context.env`, so any
      // var here would be dead config anyway. `requireUser` therefore builds
      // "undefined/api/auth/get-session" in tests and the test's
      // `globalThis.fetch` mock matches that endpoint by substring — see
      // functions/api/wall-posts.test.ts. Keeping wrangler.jsonc free of a fake
      // BETTER_AUTH_URL means nothing ships to production.
    }),
  ],
  define: {
    __WALL_POST_MIGRATIONS__: JSON.stringify(migrations),
  },
  test: {
    globals: false,
    include: ['functions/**/*.test.ts'],
  },
});
