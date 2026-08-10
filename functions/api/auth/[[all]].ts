// Same-origin auth proxy — forwards /api/auth/* to the Neon Managed Better Auth
// server so the browser only ever talks to THIS origin.
//
// WHY: the session cookie must live on the app's own origin. If the auth client
// points directly at neon.tech, the cookie is scoped to neon.tech and our own
// /api/* Functions (requireUser) never see it — every write 401s. Proxying the
// auth endpoints here means Better Auth's Set-Cookie lands on OUR origin
// (Domain stripped → host-only), and requireUser finds the session on every
// request. Bonus: the Neon trusted-origins 403 (Sec-Fetch-Site: cross-site)
// disappears because the server sees a server-to-server request with no browser
// fetch-metadata headers.
//
// Env: BETTER_AUTH_URL = the Neon auth mount root, e.g.
//   https://ep-xxx.neonauth.<region>.aws.neon.tech/<db>/auth
// (routes live DIRECTLY under it: /get-session, /sign-in/email, ... — no
// /api/auth prefix).

interface Env {
  BETTER_AUTH_URL: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!env.BETTER_AUTH_URL) {
    return new Response(JSON.stringify({ error: 'BETTER_AUTH_URL is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const route = (params.all as string[]).join('/');
  const url = new URL(request.url);
  const target = `${env.BETTER_AUTH_URL.replace(/\/+$/, '')}/${route}${url.search}`;

  // Forward the request without browser fetch-metadata: the Neon origin check
  // (403 INVALID_ORIGIN) keys on Sec-Fetch-Site: cross-site. Origin/Referer are
  // KEPT — Neon's sign-up requires an Origin when callbackURL is relative
  // (400 MISSING_ORIGIN otherwise), and curl-style requests with Origin but no
  // Sec-Fetch pass the weak origin check.
  const headers = new Headers(request.headers);
  headers.delete('sec-fetch-site');
  headers.delete('sec-fetch-mode');
  headers.delete('sec-fetch-dest');
  headers.delete('sec-fetch-user');

  let res: Response;
  try {
    res = await fetch(target, {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'manual',
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'auth proxy upstream failure', detail: String(e) }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Rewrite Set-Cookie so the session cookie is host-only for OUR origin —
  // strip any Domain attribute (and drop SameSite=None which requires Secure +
  // a domain; our dev origins are http/https LAN and localhost).
  const outHeaders = new Headers(res.headers);
  const setCookies = res.headers.getSetCookie?.() ?? [];
  if (setCookies.length) {
    outHeaders.delete('set-cookie');
    for (const raw of setCookies) {
      const cleaned = raw
        .replace(/;\s*Domain=[^;]*/gi, '')
        .replace(/;\s*SameSite=(None|Lax|Strict)/gi, '; SameSite=Lax');
      outHeaders.append('set-cookie', cleaned);
    }
  }

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: outHeaders,
  });
};
