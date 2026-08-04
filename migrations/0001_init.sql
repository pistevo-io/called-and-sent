-- Called & Sent — initial D1 schema
-- Core app content (trips, wall posts) + profile info, keyed to the Better Auth
-- user id (Neon managed auth stays the system of record for credentials).

-- ---------------------------------------------------------------------------
-- profiles — one row per user (public profile data shown at /:slug)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  user_id          TEXT PRIMARY KEY,          -- Neon Better Auth user.id
  slug             TEXT NOT NULL UNIQUE,      -- URL handle e.g. "k"
  display_name     TEXT,
  bio              TEXT,
  photo_url        TEXT,
  theme            TEXT DEFAULT 'dark',
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles (slug);

-- ---------------------------------------------------------------------------
-- trips — a missionary's mission trips, shown on public + owner views
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trips (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  title          TEXT NOT NULL,
  location       TEXT,
  country        TEXT,
  coordinates    TEXT,                        -- JSON { lng, lat } or NULL
  date           TEXT,
  duration       TEXT,
  description    TEXT,
  story          TEXT,
  images         TEXT NOT NULL DEFAULT '[]',  -- JSON array of URLs
  highlights     TEXT NOT NULL DEFAULT '[]',  -- JSON array of strings
  people_reached INTEGER,
  ministry_type  TEXT NOT NULL DEFAULT '[]',  -- JSON array of strings
  status         TEXT CHECK (status IN ('completed','upcoming')),
  sort_order     INTEGER,                     -- optional manual ordering
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_trips_user   ON trips (user_id);
CREATE INDEX IF NOT EXISTS idx_trips_slug   ON trips (user_id, status);

-- ---------------------------------------------------------------------------
-- wall_posts — public faith-wall feed (testimonies, updates, prayer requests)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wall_posts (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT,
  post_type  TEXT DEFAULT 'update',           -- testimony | prayer | update | praise | scripture
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wall_posts_user      ON wall_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_wall_posts_user_date ON wall_posts (user_id, created_at DESC);
