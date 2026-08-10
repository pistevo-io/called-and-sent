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

## Reset-link redirect: Neon `trustedOrigins` (dashboard config, no code)

The forgot-password flow calls `authClient.requestPasswordReset` with
`redirectTo: ${window.location.origin}/reset-password` (see
`src/features/auth/ForgotPasswordPage.tsx`). The emailed link lands back on
that origin with a `?token=...` query param, which `ResetPasswordPage` reads to
submit the new password.

Because Neon Managed Better Auth hosts no reset page itself, the **redirect
origin must be in the auth server's `trustedOrigins`** or the emailed-link
redirect is rejected by Neon's origin check. This is configured in the Neon
dashboard (not in this repo), so keep it in sync with the deployment:

- **Production:** the prod origin (the domain serving the Pages site) must be
  in `trustedOrigins`.
- **Local dev:** `http://localhost:5173` must be in `trustedOrigins` for the
  emailed link to land on the Vite dev server.

If a reset link opens with an "invalid" state immediately, first confirm the
origins above are listed in Neon — the `?error=INVALID_TOKEN` redirect (no
`token` param) is how Neon reports a blocked redirect.

## Other bindings (declared in `wrangler.jsonc`)

- `called_and_sent` — D1 database (read/write profiles, trips, wall posts).
- `called_and_sent_media` — R2 bucket for uploaded images.

## Contact form (`/api/contact`)

The support modal's contact form (Turnstile-verified email submission) reads
the following plain environment variables (not bindings — no D1/KV storage;
submissions are delivered by email only):

- `TURNSTILE_SECRET_KEY` — server-side Cloudflare Turnstile secret. **Required
  in production.** When set, `cf-turnstile-response` is verified against
  siteverify before the email is sent; a missing/invalid token gets a
  400/403. When absent (local dev), verification is skipped so the form stays
  testable without secrets.
- `CONTACT_TO_EMAIL` — where submissions are delivered (required).
- `CONTACT_FROM_EMAIL` — sender address on a domain authenticated for
  MailChannels in Cloudflare (required). MailChannels is the free Cloudflare
  integration (no API key); the sending domain must have the `_mailchannels`
  TXT record (`v=mc1 cfid=...`) in Cloudflare DNS.
- `RESEND_API_KEY` — optional. When present, email goes via Resend
  (`https://api.resend.com/emails`) instead of MailChannels. The `from`
  address must be a verified domain in the Resend account.

The client-side Turnstile site key is a **build-time** `VITE_*` variable:
`VITE_TURNSTILE_SITE_KEY` (see `.env.example`; SupportModal falls back to the
previously hardcoded key when unset). The site key is public — only the
secret (`TURNSTILE_SECRET_KEY`) is sensitive.
