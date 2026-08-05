-- Called & Sent — 0002: wall-post lifecycle
--
-- ADR-0001: the post lifecycle lives on the wall_posts row as a `status`
-- column (draft | published | archived), with post images in a sibling
-- `post_images` table. Existing rows are backfilled to 'published' so nothing
-- already live disappears. Deleted posts are hard-deleted.

-- ---------------------------------------------------------------------------
-- 1. Add status to wall_posts (backfill existing rows to published).
-- ---------------------------------------------------------------------------
ALTER TABLE wall_posts ADD COLUMN status TEXT NOT NULL DEFAULT 'published'
  CHECK (status IN ('draft', 'published', 'archived'));

CREATE INDEX IF NOT EXISTS idx_wall_posts_user_status ON wall_posts (user_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. post_images — ordered image references per wall post.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_images (
  id        TEXT PRIMARY KEY,          -- stable uuid per image reference
  post_id   TEXT NOT NULL,
  url       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES wall_posts (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_post_images_post ON post_images (post_id, sort_order);

-- PRAGMA foreign_keys is ON by default in D1.
