// API integration tests for /api/contact — the support modal's contact form
// (Turnstile-verified email submission).
//
// Runs under the @cloudflare/vitest-pool-workers pool. Two layers:
//   1. The compiled Pages bundle (`exports.default`) — routing, CORS, and the
//      validation/error paths that don't need secrets.
//   2. `handleContactPost` called directly with a fabricated env — the
//      Turnstile + email-send paths. The pool does NOT propagate
//      `miniflare.vars` to the Pages `context.env`, so the bundle cannot
//      exercise the full happy path; calling the exported handler with an
//      explicit env object is the honest way to test it (same constraint as
//      wall-posts' BETTER_AUTH_URL note).

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exports } from 'cloudflare:workers';
import { handleContactPost, verifyTurnstile } from './contact';

const BASE = 'https://called-and-sent.example';

// The compiled Pages Functions entry (the worker under test).
const handler = (exports as unknown as {
  default: { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> };
}).default;

function bundleReq(path: string, init?: RequestInit): Promise<Response> {
  return handler.fetch(new URL(path, BASE).toString(), init);
}

function formBody(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    name: 'Jane Donor',
    email: 'jane@example.com',
    message: 'Praying for your trip!',
    'cf-turnstile-response': 'token-ok',
    ...overrides,
  });
}

// A fabricated Pages `context.env` for the direct handler tests.
function testEnv(overrides: Record<string, string | undefined> = {}): Record<string, string> {
  return {
    TURNSTILE_SECRET_KEY: 'secret-test',
    CONTACT_TO_EMAIL: 'missions@calledandsent.me',
    CONTACT_FROM_EMAIL: 'no-reply@calledandsent.me',
    ...overrides,
  };
}

let realFetch: typeof globalThis.fetch;

beforeEach(() => {
  realFetch = globalThis.fetch.bind(globalThis);
});

describe('/api/contact routing + validation (bundle)', () => {
  it('answers OPTIONS with CORS preflight headers', async () => {
    const res = await bundleReq('/api/contact', { method: 'OPTIONS' });
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('rejects invalid JSON with 400', async () => {
    const res = await bundleReq('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain('Invalid JSON');
  });

  it('rejects missing required fields with 400', async () => {
    const res = await bundleReq('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: formBody({ email: '', message: '' }),
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain('required');
  });

  it('rejects a malformed email with 400', async () => {
    const res = await bundleReq('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: formBody({ email: 'not-an-email' }),
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain('Invalid email');
  });

  it('rejects oversized messages with 400', async () => {
    const res = await bundleReq('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: formBody({ message: 'x'.repeat(5001) }),
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain('too long');
  });

  it('returns 500 (not 404) when the form is not configured — the fixed path', async () => {
    // In the pool, context.env has no contact vars, so the handler must reach
    // the "not configured" branch instead of the endpoint 404ing.
    const res = await bundleReq('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: formBody(),
    });
    expect(res.status).toBe(500);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain('not configured');
  });
});

describe('handleContactPost — Turnstile + email paths (direct env)', () => {
  it('rejects a missing Turnstile token with 400 when a secret is configured', async () => {
    vi.stubGlobal('fetch', realFetch);
    const res = await handleContactPost(
      new Request(`${BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: formBody({ 'cf-turnstile-response': '' }),
      }),
      testEnv(),
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain('Security verification');
  });

  it('rejects an invalid Turnstile token with 403', async () => {
    vi.stubGlobal(
      'fetch',
      async (input: RequestInfo | URL): Promise<Response> => {
        const target = typeof input === 'string' ? input : (input as Request).url;
        if (target.includes('challenges.cloudflare.com/turnstile/v0/siteverify')) {
          return new Response(JSON.stringify({ success: false }), { status: 200 });
        }
        return realFetch(input);
      },
    );
    const res = await handleContactPost(
      new Request(`${BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: formBody(),
      }),
      testEnv(),
    );
    expect(res.status).toBe(403);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain('Security verification failed');
  });

  it('sends via MailChannels and returns success when Turnstile passes', async () => {
    let mailchannelsBody: unknown = null;
    vi.stubGlobal(
      'fetch',
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const target = typeof input === 'string' ? input : (input as Request).url;
        if (target.includes('challenges.cloudflare.com/turnstile/v0/siteverify')) {
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        if (target.includes('api.mailchannels.net/tx/v1/send')) {
          mailchannelsBody = init?.body ? JSON.parse(String(init.body)) : null;
          return new Response('', { status: 202 });
        }
        return realFetch(input, init);
      },
    );

    const res = await handleContactPost(
      new Request(`${BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: formBody(),
      }),
      testEnv(),
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as { success: boolean };
    expect(data.success).toBe(true);

    expect(mailchannelsBody).not.toBeNull();
    const sent = mailchannelsBody as {
      personalizations: Array<{ to: Array<{ email: string }> }>;
      from: { email: string };
      subject: string;
      content: Array<{ value: string }>;
    };
    expect(sent.personalizations[0].to[0].email).toBe('missions@calledandsent.me');
    expect(sent.from.email).toBe('no-reply@calledandsent.me');
    expect(sent.subject).toContain('Jane Donor');
    expect(sent.content[0].value).toContain('Praying for your trip!');
  });

  it('uses Resend when RESEND_API_KEY is configured', async () => {
    let resendBody: unknown = null;
    let authHeader: string | null = null;
    vi.stubGlobal(
      'fetch',
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const target = typeof input === 'string' ? input : (input as Request).url;
        if (target.includes('challenges.cloudflare.com/turnstile/v0/siteverify')) {
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        if (target.includes('api.resend.com/emails')) {
          resendBody = init?.body ? JSON.parse(String(init.body)) : null;
          authHeader = (init?.headers as Record<string, string> | undefined)?.['Authorization'] ?? null;
          return new Response(JSON.stringify({ id: 'resend-1' }), { status: 200 });
        }
        return realFetch(input, init);
      },
    );

    const res = await handleContactPost(
      new Request(`${BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: formBody(),
      }),
      testEnv({ RESEND_API_KEY: 're_secret' }),
    );

    expect(res.status).toBe(200);
    expect(authHeader).toBe('Bearer re_secret');
    const sent = resendBody as { from: string; to: string[]; text: string };
    expect(sent.to).toEqual(['missions@calledandsent.me']);
    expect(sent.text).toContain('Jane Donor');
  });

  it('skips Turnstile verification when no secret is configured (local dev)', async () => {
    let mailchannelsCalled = false;
    vi.stubGlobal(
      'fetch',
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const target = typeof input === 'string' ? input : (input as Request).url;
        if (target.includes('api.mailchannels.net/tx/v1/send')) {
          mailchannelsCalled = true;
          return new Response('', { status: 202 });
        }
        return realFetch(input, init);
      },
    );

    const res = await handleContactPost(
      new Request(`${BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: formBody({ 'cf-turnstile-response': '' }),
      }),
      testEnv({ TURNSTILE_SECRET_KEY: '' }),
    );

    expect(res.status).toBe(200);
    expect(mailchannelsCalled).toBe(true);
  });

  it('returns 502 when the email provider fails', async () => {
    vi.stubGlobal(
      'fetch',
      async (input: RequestInfo | URL): Promise<Response> => {
        const target = typeof input === 'string' ? input : (input as Request).url;
        if (target.includes('challenges.cloudflare.com/turnstile/v0/siteverify')) {
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        if (target.includes('api.mailchannels.net/tx/v1/send')) {
          return new Response('provider down', { status: 500 });
        }
        return realFetch(input);
      },
    );

    const res = await handleContactPost(
      new Request(`${BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: formBody(),
      }),
      testEnv(),
    );

    expect(res.status).toBe(502);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain('Failed to send');
  });
});

describe('verifyTurnstile', () => {
  it('returns true when siteverify reports success', async () => {
    vi.stubGlobal(
      'fetch',
      async () => new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    await expect(verifyTurnstile('secret', 'token')).resolves.toBe(true);
  });

  it('returns false when siteverify reports failure', async () => {
    vi.stubGlobal(
      'fetch',
      async () => new Response(JSON.stringify({ success: false }), { status: 200 }),
    );
    await expect(verifyTurnstile('secret', 'token')).resolves.toBe(false);
  });

  it('returns false when the siteverify call itself fails', async () => {
    vi.stubGlobal('fetch', async () => new Response('boom', { status: 500 }));
    await expect(verifyTurnstile('secret', 'token')).resolves.toBe(false);
  });
});
