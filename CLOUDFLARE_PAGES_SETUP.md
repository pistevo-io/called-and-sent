# Cloudflare Pages Setup Guide

## Contact Form Configuration

The contact form (`/api/contact`, SupportModal "Partner With Me") is
Turnstile-verified and delivers submissions **by email** — MailChannels by
default (free Cloudflare integration, no API key) or Resend if
`RESEND_API_KEY` is set. It needs **no D1/KV bindings**; the old
D1/KV/ntfy setup was removed. See `FUNCTIONS_ENV.md` for the full env
contract.

### Required Environment Variables (Pages dashboard or `.dev.vars` locally)

| Variable | Purpose |
|---|---|
| `TURNSTILE_SECRET_KEY` | Server-side Turnstile secret. Required in production; verification is skipped when absent (local dev). |
| `CONTACT_TO_EMAIL` | Where submissions are delivered. |
| `CONTACT_FROM_EMAIL` | Sender address on a domain authenticated for MailChannels in Cloudflare. |

Optional: `RESEND_API_KEY` — switch email delivery from MailChannels to
Resend (`https://api.resend.com/emails`).

Client-side build-time variable (`.env` / `.env.example`):
`VITE_TURNSTILE_SITE_KEY` — the public Turnstile site key (SupportModal
falls back to the previously hardcoded key when unset).

### How to Configure in Cloudflare Dashboard

1. Go to **Cloudflare Dashboard** > **Workers & Pages**
2. Click on your **called-and-sent** Pages project
3. Go to **Settings** > **Functions** > **Variables**
4. Add each variable (Production environment):
   - `TURNSTILE_SECRET_KEY` — **Encrypt** (recommended)
   - `CONTACT_TO_EMAIL`
   - `CONTACT_FROM_EMAIL`
   - `RESEND_API_KEY` (optional) — **Encrypt** (recommended)

### Authenticate the Sender Domain for MailChannels

MailChannels requires the sending domain to be authenticated in Cloudflare
(one-time setup):

1. In Cloudflare DNS for your domain, add a TXT record:
   - **Name**: `_mailchannels`
   - **Value**: `v=mc1 cfid=called-and-sent.pages.dev`
2. `CONTACT_FROM_EMAIL` must use that domain (e.g.
   `no-reply@calledandsent.me`).
3. First send may take a few minutes to propagate; check the Pages function
   logs (`Workers & Pages` > **called-and-sent** > **Functions** > **Logs**).

Alternative: set `RESEND_API_KEY` and verify the `from` domain in the Resend
account instead — no DNS record needed.

### Testing the Setup

After deploying:

1. Visit your site: `https://calledandsent.me`
2. Click the "Partner With Me" button
3. Fill out the contact form (complete the Turnstile widget)
4. Submit
5. Check:
   - Form should show "Message sent successfully!"
   - You should receive the submission email at `CONTACT_TO_EMAIL`

Local smoke test against `wrangler pages dev` (with `.dev.vars` populated):

```bash
curl -i -X POST http://localhost:8788/api/contact \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@example.com","message":"Hello","cf-turnstile-response":"dummy"}'
```

Without `TURNSTILE_SECRET_KEY` locally, verification is skipped and the
request proceeds to email delivery (MailChannels may reject unauthenticated
senders in local dev — see logs).

### Troubleshooting

**Form shows error on submit:**
- Check that `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` are set (handler
  returns 500 "Contact form is not configured" otherwise).
- Check browser console and Pages function logs.
- With `TURNSTILE_SECRET_KEY` set, a missing/invalid token returns 400/403
  "Security verification ..." — reload the page and redo the widget.

**No email received:**
- Verify `_mailchannels` TXT record exists and `CONTACT_FROM_EMAIL` uses the
  authenticated domain.
- Check function logs for MailChannels/Resend non-2xx responses (handler
  returns 502 "Failed to send message").
- Try Resend: set `RESEND_API_KEY` and verify the `from` domain there.

### Security Features

- Cloudflare Turnstile verification (server-side, fails closed)
- Required fields + email format validation
- Message length limits
- CORS preflight handled for the API endpoint
