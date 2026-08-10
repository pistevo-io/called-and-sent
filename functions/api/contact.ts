// /api/contact — contact form submission (SupportModal "Partner With Me").
//
// Flow:
//   1. Parse + validate the submission (name, email, message).
//   2. Verify the Cloudflare Turnstile token (cf-turnstile-response) against
//      siteverify when TURNSTILE_SECRET_KEY is configured (production).
//   3. Send the message by email — MailChannels by default (free Cloudflare
//      integration, no API key), or Resend when RESEND_API_KEY is set.
//
// Env (see FUNCTIONS_ENV.md):
//   TURNSTILE_SECRET_KEY  — server-side Turnstile secret. When missing (local
//                           dev), verification is skipped so the form stays
//                           testable without secrets.
//   CONTACT_TO_EMAIL      — where submissions are delivered (required).
//   CONTACT_FROM_EMAIL    — sender address on a domain authenticated for
//                           MailChannels in Cloudflare (required).
//   RESEND_API_KEY        — optional; when present, email goes via Resend
//                           instead of MailChannels.
//
// Response contract matches SupportModal.tsx: 2xx => { success, message },
// otherwise { error }.

import { json, corsPreflight, parseJson } from './_shared/http';

interface Env {
  TURNSTILE_SECRET_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  RESEND_API_KEY?: string;
}

interface ContactFormBody {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  'cf-turnstile-response'?: unknown;
}

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAILCHANNELS_API_URL = 'https://api.mailchannels.net/tx/v1/send';
const RESEND_API_URL = 'https://api.resend.com/emails';

const NAME_MAX = 120;
const MESSAGE_MAX = 5000;

function isEmail(v: string): boolean {
  // Deliberately simple — matches the old contract (must contain @ and a dot).
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * Server-side Turnstile verification. Resolves true only when siteverify
 * returns success. Any failure (invalid token, service error) resolves false
 * so the request is rejected — the form fails closed rather than open.
 */
export async function verifyTurnstile(secret: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error('Turnstile verification error:', err);
    return false;
  }
}

/**
 * Send the submission via MailChannels (free Cloudflare integration — the
 * sender domain is authenticated in Cloudflare with a `_mailchannels` TXT
 * record; no API key needed). Throws on non-2xx so the caller returns a 502.
 */
async function sendViaMailChannels(opts: {
  to: string;
  from: string;
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const res = await fetch(MAILCHANNELS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: opts.to }] }],
      from: { email: opts.from, name: 'Called & Sent Contact Form' },
      subject: `New contact form submission from ${opts.name}`,
      content: [
        {
          type: 'text/plain',
          value: `Name: ${opts.name}\nEmail: ${opts.email}\n\n${opts.message}`,
        },
      ],
    }),
  });
  if (!res.ok) {
    console.error('MailChannels send failed:', res.status, await res.text());
    throw new Error(`MailChannels send failed with status ${res.status}`);
  }
}

/**
 * Send the submission via Resend when RESEND_API_KEY is configured. Throws on
 * non-2xx so the caller returns a 502.
 */
async function sendViaResend(opts: {
  apiKey: string;
  to: string;
  from: string;
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      subject: `New contact form submission from ${opts.name}`,
      text: `Name: ${opts.name}\nEmail: ${opts.email}\n\n${opts.message}`,
    }),
  });
  if (!res.ok) {
    console.error('Resend send failed:', res.status, await res.text());
    throw new Error(`Resend send failed with status ${res.status}`);
  }
}

/**
 * Main handler, split from onRequestPost so tests can inject a fabricated env
 * (the vitest pool does not propagate vars to the Pages context.env).
 */
export async function handleContactPost(request: Request, env: Env): Promise<Response> {
  const body = await parseJson<ContactFormBody>(request);
  if (!body) {
    return json({ error: 'Invalid JSON in request body' }, 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const turnstileToken =
    typeof body['cf-turnstile-response'] === 'string' ? body['cf-turnstile-response'] : '';

  // Required fields + basic shape validation.
  if (!name || !email || !message) {
    return json({ error: 'Name, email, and message are required' }, 400);
  }
  if (name.length > NAME_MAX || message.length > MESSAGE_MAX) {
    return json({ error: 'Message is too long' }, 400);
  }
  if (!isEmail(email)) {
    return json({ error: 'Invalid email address' }, 400);
  }

  // Turnstile: enforced when the secret is configured (production); skipped
  // when absent (local dev) so the form remains testable without secrets.
  if (env.TURNSTILE_SECRET_KEY) {
    if (!turnstileToken) {
      return json({ error: 'Security verification required' }, 400);
    }
    const verified = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, turnstileToken);
    if (!verified) {
      return json({ error: 'Security verification failed. Please try again.' }, 403);
    }
  }

  // Email delivery config.
  if (!env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    console.error(
      'Contact form misconfigured: CONTACT_TO_EMAIL and CONTACT_FROM_EMAIL must be set'
    );
    return json({ error: 'Contact form is not configured' }, 500);
  }

  const sendOpts = {
    to: env.CONTACT_TO_EMAIL,
    from: env.CONTACT_FROM_EMAIL,
    name,
    email,
    message,
  };

  try {
    if (env.RESEND_API_KEY) {
      await sendViaResend({ apiKey: env.RESEND_API_KEY, ...sendOpts });
    } else {
      await sendViaMailChannels(sendOpts);
    }
  } catch (err) {
    console.error('Contact form email error:', err);
    return json({ error: 'Failed to send message. Please try again later.' }, 502);
  }

  return json({ success: true, message: 'Message sent successfully!' });
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  return handleContactPost(context.request, context.env);
}

export async function onRequestOptions(): Promise<Response> {
  return corsPreflight();
}
