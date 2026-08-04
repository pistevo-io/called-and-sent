// Standalone smoke test for functions/api/user/change-password.ts.
// Bundles the TS function with esbuild, mocks `fetch` (Better Auth), and
// exercises the handler + exported validators with Node's built-in globals.
//
// Run: node scripts/test-change-password.mjs
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert';

const result = await build({
  entryPoints: ['functions/api/user/change-password.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
});
const code = result.outputFiles[0].text;
writeFileSync('/tmp/change-password.mjs', code);
const mod = await import('/tmp/change-password.mjs');

let fetchCalls = [];
globalThis.fetch = async (url, opts = {}) => {
  fetchCalls.push({ url, opts });
  if (String(url).includes('/api/auth/session')) {
    return new Response(JSON.stringify({ user: { id: 'user-123' } }), {
      status: 200,
    });
  }
  if (String(url).includes('/api/auth/change-password')) {
    const body = JSON.parse(opts.body);
    if (body.currentPassword === 'wrong') {
      return new Response(
        JSON.stringify({ message: 'Current password is invalid' }),
        { status: 400 },
      );
    }
    return new Response('{}', { status: 200 });
  }
  return new Response('{}', { status: 200 });
};

const env = { BETTER_AUTH_URL: 'https://auth.example.com' };
const auth = 'Bearer tok123';
const url = 'https://app.example.com/api/user/change-password';

async function post(bodyObj, headers = {}) {
  const req = new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
      ...headers,
    },
    body: JSON.stringify(bodyObj),
  });
  return mod.onRequestPost({ request: req, env });
}

// 1. happy path
let r = await post({
  current_password: 'OldPass1',
  new_password: 'NewPass1',
  confirmation: 'NewPass1',
});
let j = await r.json();
assert.strictEqual(r.status, 200, 'happy path should be 200');
assert.strictEqual(j.success, true, 'happy path success:true');

// 2. weak password -> 422 with details
r = await post({
  current_password: 'OldPass1',
  new_password: 'abc',
  confirmation: 'abc',
});
j = await r.json();
assert.strictEqual(r.status, 422, 'weak password -> 422');
assert.ok(Array.isArray(j.details) && j.details.length > 0, 'weak -> details');

// 3. confirmation mismatch -> 422
r = await post({
  current_password: 'OldPass1',
  new_password: 'NewPass1',
  confirmation: 'Different1',
});
assert.strictEqual(r.status, 422, 'mismatch -> 422');

// 4. invalid current password -> 401 (normalized)
r = await post({
  current_password: 'wrong',
  new_password: 'NewPass1',
  confirmation: 'NewPass1',
});
assert.strictEqual(r.status, 401, 'invalid current -> 401');

// 5. missing fields -> 400
r = await post({ current_password: 'x' });
assert.strictEqual(r.status, 400, 'missing fields -> 400');

// 6. no auth header -> 401
const noAuthReq = new Request(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({}),
});
let r6 = await mod.onRequestPost({ request: noAuthReq, env });
assert.strictEqual(r6.status, 401, 'no auth -> 401');

// 7. unit: validatePasswordStrength
assert.strictEqual(
  mod.validatePasswordStrength('Abcdefg1').valid,
  true,
  'Abcdefg1 (8 chars) valid',
);
assert.strictEqual(
  mod.validatePasswordStrength('abcdef1').valid,
  false,
  'no uppercase -> invalid',
);
assert.strictEqual(
  mod.validatePasswordStrength('Abcdefgh').valid,
  false,
  'no digit -> invalid',
);
assert.strictEqual(
  mod.validatePasswordStrength('Ab1 ').valid,
  false,
  'whitespace + short -> invalid',
);
assert.strictEqual(
  mod.validatePasswordStrength('short1A').valid,
  false,
  '<8 chars -> invalid',
);

// 8. verify upstream change-password was called with revokeOtherSessions:true
const changeCall = fetchCalls.find((c) =>
  String(c.url).includes('/api/auth/change-password'),
);
assert.ok(changeCall, 'upstream change-password called');
assert.strictEqual(
  JSON.parse(changeCall.opts.body).revokeOtherSessions,
  true,
  'revokeOtherSessions true',
);

console.log(
  `ALL TESTS PASSED (${fetchCalls.length} fetch calls, no external network used)`,
);
