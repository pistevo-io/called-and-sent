// scripts/seed-content.mjs
//
// One-shot data migration: seed the owner's profile row + 4 mission trips + 3
// wall posts into the D1 database. Reads the canonical seed data straight from
// `src/shared/data/*` (the same files the frontend previously rendered from),
// so this script never drifts from the source of truth.
//
// KEYING: every row is keyed to the owner's REAL Better Auth `user_id`. That id
// MUST match the session `user.id` Better Auth returns, otherwise the owner's
// future writes (scoped to their session id) won't appear under the `slug`-resolved
// list. The id is supplied via env (see README block at the bottom) — it is never
// guessed or hardcoded here.
//
// Usage:
//   OWNER_USER_ID=<uuid> [OWNER_SLUG=k] [OWNER_DISPLAY_NAME='Called & Sent'] \
//     node --experimental-strip-types scripts/seed-content.mjs [--remote|--local]
//
//   --remote  apply to the production D1 database (wrangler --remote)
//   --local   apply to the local miniflare D1 instance (default)
//   --dump    emit the exact .sql to stdout (no DB touched) for review
//
// Requires `wrangler` (npx) authenticated for the target D1 database.
// NOTE: wrangler >=4 removed `d1 execute --pipe`; we apply a generated .sql file
// via `wrangler d1 execute --file` (works for --local and --remote alike).

import { missionTrips } from '../src/shared/data/missionTrips.ts';
import { wallPosts } from '../src/shared/data/wallPosts.ts';
import { writeFileSync } from 'node:fs';

const OWNER_USER_ID = process.env.OWNER_USER_ID?.trim();
const OWNER_SLUG = process.env.OWNER_SLUG?.trim() || 'k';
const OWNER_DISPLAY_NAME =
  process.env.OWNER_DISPLAY_NAME?.trim() || 'Called & Sent';

if (!OWNER_USER_ID) {
  console.error(
    'ERROR: OWNER_USER_ID is required.\n' +
      '       It is the owner\'s Better Auth user.id (the session `user.id` returned by\n' +
      '       Better Auth /api/auth/get-session). Obtain it from the Neon/Better Auth\n' +
      '       dashboard (the `neon_auth.user` table managed by Better Auth) and export it:\n' +
      '         export OWNER_USER_ID=<uuid>\n' +
      '       This script never invents or guesses the id — the profile row and all\n' +
      '       content must be keyed to the real owner id so the owner\'s future writes\n' +
      '       (scoped to their session id) resolve under ?slug=' +
      OWNER_SLUG +
      '.',
  );
  process.exit(1);
}

// Validate it looks like a UUID (Better Auth user ids are UUIDs).
if (
  !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    OWNER_USER_ID,
  )
) {
  console.error(
    `ERROR: OWNER_USER_ID "${OWNER_USER_ID}" does not look like a UUID.\n` +
      '       Better Auth user ids are UUIDs. Check the value you exported.',
  );
  process.exit(1);
}

const target = process.argv.includes('--remote') ? 'remote' : 'local';
const wranglerFlag = target === 'remote' ? '--remote' : '--local';
const dumpOnly = process.argv.includes('--dump');

const NOW = Symbol('datetime-now'); // sentinel for datetime('now') emitted raw

// Quote a JS value as a SQLite literal.
function lit(v) {
  if (v === null || v === undefined) return 'NULL';
  if (v === NOW) return "datetime('now')";
  if (typeof v === 'number') return String(v);
  // string: escape single quotes as ''
  return `'${String(v).replace(/'/g, "''")}'`;
}

function profileSql() {
  const cols = ['user_id', 'slug', 'display_name', 'theme', 'created_at', 'updated_at'];
  const vals = [
    OWNER_USER_ID,
    OWNER_SLUG,
    OWNER_DISPLAY_NAME,
    'dark',
    NOW,
    NOW,
  ];
  return (
    'INSERT OR IGNORE INTO profiles (' +
    cols.join(', ') +
    ') VALUES (' +
    vals.map(lit).join(', ') +
    ');'
  );
}

function tripSql(trip, idx) {
  const cols = [
    'id', 'user_id', 'title', 'location', 'country', 'coordinates', 'date',
    'duration', 'description', 'story', 'images', 'highlights',
    'people_reached', 'ministry_type', 'status', 'sort_order',
    'created_at', 'updated_at',
  ];
  const vals = [
    trip.id,
    OWNER_USER_ID,
    trip.title,
    trip.location ?? null,
    trip.country ?? null,
    JSON.stringify(trip.coordinates ?? null),
    trip.date ?? null,
    trip.duration ?? null,
    trip.description ?? null,
    trip.story ?? null,
    JSON.stringify(trip.images ?? []),
    JSON.stringify(trip.highlights ?? []),
    typeof trip.peopleReached === 'number' ? trip.peopleReached : null,
    JSON.stringify(trip.ministryType ?? []),
    trip.status ?? 'upcoming',
    idx,
    NOW,
    NOW,
  ];
  return (
    'INSERT OR IGNORE INTO trips (' +
    cols.join(', ') +
    ') VALUES (' +
    vals.map(lit).join(', ') +
    ');'
  );
}

function postSql(post) {
  const cols = ['id', 'user_id', 'title', 'content', 'post_type', 'created_at', 'updated_at'];
  const vals = [
    post.id,
    OWNER_USER_ID,
    post.title,
    post.content ?? null,
    'update',
    NOW,
    NOW,
  ];
  return (
    'INSERT OR IGNORE INTO wall_posts (' +
    cols.join(', ') +
    ') VALUES (' +
    vals.map(lit).join(', ') +
    ');'
  );
}

const statements = [
  profileSql(),
  ...missionTrips.map(tripSql),
  ...wallPosts.map(postSql),
];
const sql = statements.join('\n');

if (dumpOnly) {
  process.stdout.write(sql + '\n');
  process.exit(0);
}

// Write the .sql to a temp file (outside the repo) and apply via wrangler
// --file (works for both --local and --remote; --pipe was removed in wrangler 4).
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unlinkSync } from 'node:fs';
const tmpPath = join(tmpdir(), `seed-content-${Date.now()}.sql`);
writeFileSync(tmpPath, sql);
const tmp = { pathname: tmpPath };

const { spawnSync } = await import('node:child_process');
const res = spawnSync(
  'npx',
  ['wrangler', 'd1', 'execute', 'called-and-sent', wranglerFlag, '--file', tmp.pathname, '--yes'],
  { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 },
);
if (res.status !== 0) {
  console.error(`FAILED to apply content (${target}):`);
  console.error(res.stderr || res.stdout);
  unlinkSync(tmp.pathname); // clean up even on failure
  process.exit(1);
}
console.log(`Applied -> ${target}: ${statements.length} statement(s)`);
if (res.stdout) console.log(res.stdout.trim());
unlinkSync(tmp.pathname); // clean up after success

console.log('\nDone. Verify with:');
console.log(
  `  npx wrangler d1 execute called-and-sent ${wranglerFlag} --yes --command "SELECT count(*) AS trips FROM trips; SELECT count(*) AS posts FROM wall_posts; SELECT slug FROM profiles;"`,
);
