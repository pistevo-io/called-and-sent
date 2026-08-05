# Wall post lifecycle: drafts live in wall_posts, public reads filter by status

**Status: accepted** (2026-08-05, grill-with-docs session)

Wall posts used to be immediately public: the public GET returned every row for
a slug, and the owner's dashboard could only create/publish in one step. The
owner wanted a social-media-style posting flow — write posts privately, publish
later, unpublish, archive — so we decided the lifecycle lives **on the
`wall_posts` row itself** as a `status` column (`draft | published | archived`),
with post images in a sibling `post_images` table, and **all public reads filter
to `status = 'published'` through a single helper**.

**Considered options:**

- *Status column on `wall_posts`* (chosen) — one table, one source of truth,
  trivial to query; the risk is a public query forgetting the filter and leaking
  drafts. Mitigated by routing every public read through one "published posts by
  slug" helper so the filter is written once.
- *Separate `drafts` table* — zero leak risk by construction, but splits the
  post model, complicates publish (row moves), and doubles the editor/API
  surface for no user-visible benefit.

**Consequences:** deleting a post is a hard delete of the row + its images;
archived posts stay in the same table with a status; scheduled publishing was
explicitly rejected during the session (no future-publish state).
