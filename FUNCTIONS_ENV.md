# Functions Environment Variables (source of truth)

This documents the runtime environment bindings consumed by the Pages
Functions under `functions/api/**`. These are **Workers-runtime** bindings
(consumed at request time via `env.*`), distinct from the Vite **build-time**
`VITE_*` variables that the frontend bundle reads.

## `BETTER_AUTH_URL` (required for all auth'd endpoints)

- **What it is:** the origin of the Better Auth instance that owns credentials
  (system of record). The Functions resolve a session by POSTing the caller's
  cookie to `${BETTER_AUTH_URL}/api/auth/get-session` (see
  `functions/api/_shared/auth.ts`).
- **Consumed by:** every authenticated endpoint — `POST/PUT/DELETE /api/trips`,
  `POST/DELETE /api/wall-posts`, `POST/PUT /api/profile`, `POST /api/upload`,
  `POST /api/user/change-password`. If it is missing/unset, `requireUser()`
  returns `null` and every write 401s.
- **Local dev:** set in `.dev.vars` (git-ignored). The value mirrors
  `VITE_NEON_AUTH_URL` from `.env` — they point at the same Better Auth origin,
  but `VITE_NEON_AUTH_URL` is baked into the frontend build while
  `BETTER_AUTH_URL` is the runtime binding the Functions read. Keep the two
  in sync.
- **Production:** set as a **Pages dashboard environment variable**
  (`Settings > Functions > Variables`, Production) named `BETTER_AUTH_URL`.
  Never commit it to `.env` or `.dev.vars` for prod — the dashboard is the
  source of truth for prod secrets/bindings.

## Why two names instead of one

`VITE_NEON_AUTH_URL` is read at Vite build time (frontend) and `BETTER_AUTH_URL`
is read at Workers runtime (Functions). They cannot share a single variable
across both contexts, so the contract is: **same origin, two bindings, kept in
sync.** Renaming would require threading the Vite var into the Function bundle,
which is not how Pages Functions receive bindings.

## Other bindings (declared in `wrangler.jsonc`)

- `called_and_sent` — D1 database (read/write profiles, trips, wall posts).
- `called_and_sent_media` — R2 bucket for uploaded images.
