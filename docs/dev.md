# Dev Environment Setup

How to run Called & Sent locally, what every environment variable means, and
the pitfalls that make a fresh checkout look broken.

## Quickstart

```bash
git clone <repo-url> called-and-sent
cd called-and-sent
npm install
cp .env.example .env   # then edit .env with your real values (below)
npm run dev            # Vite dev server -> http://localhost:5173
```

That is enough to boot the UI, but **login will be dead** until
`VITE_NEON_AUTH_URL` points at a reachable Better Auth instance (see below).

## Environment variables

### Frontend (`VITE_*` — public, baked into the client bundle)

These live in `.env` at the repo root (git-ignored). They are PUBLIC — they
ship to the browser — so never put secrets next to a `VITE_` prefix.

| Variable | Required? | What it is | Where it's used |
| --- | --- | --- | --- |
| `VITE_MAPBOX_TOKEN` | map only | Mapbox public token for map tiles/terrain. Get one at <https://account.mapbox.com/> | `src/features/profile/MissionMap.tsx` |
| `VITE_NEON_AUTH_URL` | **login/auth** | Origin of the Neon Managed Better Auth instance that owns credentials | `src/features/auth/auth.ts`, `src/features/settings/settingsApi.ts` |
| `VITE_TURNSTILE_SITE_KEY` | contact form | Cloudflare Turnstile **site** key (public). Leave blank to use the key bundled in `src/features/profile/SupportModal.tsx` | `src/features/profile/SupportModal.tsx` |

### `VITE_NEON_AUTH_URL` — the one that bites

Without it the app still builds and the login page renders, but **every auth
call fails**: `createAuthClient(import.meta.env.VITE_NEON_AUTH_URL)` gets an
invalid base URL, sessions never resolve, and dashboard/profile routes redirect
to `/login` forever. Symptom checklist:

- Login/signup submits and goes nowhere, or errors immediately.
- `/api/auth/*` calls 404 or return empty sessions.
- Settings profile updates fail with 401.

Fix: set it to the origin of your Better Auth instance, e.g.
`VITE_NEON_AUTH_URL=https://your-project.neon.auth`.

Keep it in sync with the Functions binding `BETTER_AUTH_URL` (same origin, two
bindings) — see [FUNCTIONS_ENV.md](../FUNCTIONS_ENV.md).

### Server-side bindings (NOT in `.env`)

`VITE_*` is Vite build-time only. Pages Functions read their environment at
request time from `env.*`:

- **D1** — `called_and_sent` (profiles, trips, wall posts)
- **R2** — `called_and_sent_media` (uploaded images, see `functions/api/upload.ts`)
- **`BETTER_AUTH_URL`** — required by every authenticated endpoint; set it in
  `.dev.vars` locally (git-ignored), mirroring `VITE_NEON_AUTH_URL`
- **`TURNSTILE_SECRET_KEY`** — server-side verification for the contact form

Both bindings are declared in `wrangler.jsonc`; in local `wrangler pages dev`
they are emulated by Miniflare — no real Cloudflare credentials needed for
local D1/R2. Full reference: [FUNCTIONS_ENV.md](../FUNCTIONS_ENV.md).

## Running the full stack (frontend + Functions)

The Vite dev server (`npm run dev`) serves the SPA only — `/api/*` routes are
handled by Pages Functions and are not available on `:5173`. To exercise auth,
uploads, and wall posts end-to-end:

```bash
npm run build        # builds dist/ (tsc + vite)
npm run pages:dev    # wrangler pages dev dist — serves SPA + Functions on :8788
```

`wrangler pages dev` picks up D1/R2 from `wrangler.jsonc` and reads
`.dev.vars` for `BETTER_AUTH_URL`/`TURNSTILE_SECRET_KEY`. Run API tests with
`npm run test:api`.

## Dev over LAN / HTTPS tip

`http://localhost` is treated by browsers as a **secure context**, so local
development on `localhost:5173` works. But accessing the dev server from
another device over the LAN — `http://192.168.x.x:5173` — is **not** a secure
context, and the auth client's PKCE flow calls `crypto.randomUUID()`, which is
undefined on insecure origins. Result: login crashes with a TypeError like
`crypto.randomUUID is not a function`.

If you must develop over the LAN, serve the dev server over HTTPS:

```bash
# Option A: local HTTPS with a dev certificate (mkcert)
mkcert -install
mkcert -key-file key.pem -cert-file cert.pem 192.168.x.x localhost
npm run dev -- --host --https --key key.pem --cert cert.pem
# then open https://192.168.x.x:5173

# Option B: Vite plugin for automatic local certs
#   npm i -D @vitejs/plugin-basic-ssl
#   add `import basicSsl from '@vitejs/plugin-basic-ssl'` to vite.config.ts plugins

# Option C: quick tunnel (no cert management)
cloudflared tunnel --url http://localhost:5173   # gives you an https:// URL
```

Whatever you use, add every origin the browser will hit (including the LAN
host and the `https://` tunnel URL) to the Turnstile widget's allowed hostnames
and to the Better Auth instance's trusted origins.

## Turnstile (contact form spam protection)

- **Site key** (public): create a widget at
  <https://dash.cloudflare.com/?to=/:account/turnstile> and add each dev
  hostname you use. Put it in `VITE_TURNSTILE_SITE_KEY`, or leave the variable
  blank to use the key bundled in `SupportModal.tsx`.
- **Secret key** (private): set `TURNSTILE_SECRET_KEY` in `.dev.vars` /
  dashboard env for the `/api/contact` endpoint's server-side verification.
- Cloudflare publishes **test keys** for local development:
  - `1x00000000000000000000AA` — always passes
  - `2x00000000000000000000AB` — always blocks (use to test the failure path)
  The widget script is loaded globally in `index.html`.

## Troubleshooting quick hits

- **Login dead but build is green** → `VITE_NEON_AUTH_URL` missing or wrong;
  check it survived the build (it is baked in at build time, so restart
  `npm run dev` after changing `.env`).
- **`/api/*` 404s on :5173** → you are on the Vite server; use
  `npm run pages:dev` (or `wrangler pages dev dist`) for Functions.
- **All write endpoints 401** → `BETTER_AUTH_URL` unset in `.dev.vars`.
- **crypto.randomUUID TypeError over LAN** → serve via HTTPS (above).
- **Turnstile widget error in console** → site key invalid for the current
  origin, or you set a placeholder value instead of leaving it blank.

See also: [FUNCTIONS_ENV.md](../FUNCTIONS_ENV.md) (Functions bindings),
[TROUBLESHOOTING.md](../TROUBLESHOOTING.md).
