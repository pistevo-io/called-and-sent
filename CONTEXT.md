# Context — Called & Sent

Project vocabulary, agreed during design sessions. Glossary only — no
implementation detail, no spec. Terms land here the moment they resolve.

- **Post** — the unit of owner-authored content on a profile's wall. Carries
  content text plus **multiple images** (shown as a **carousel**, one at a
  time); a title is optional. Has a type
  (testimony / prayer / update / praise / scripture).
- **Wall** — the public feed of a profile's published posts, newest first, with
  filter chips by post type (All / Testimony / Prayer / …).
- **Draft** — a post the owner has written but not published. Visible only to
  the owner.
- **Published** — a post visible on the public profile's wall.
- **Archived** — a post removed from the public feed but retained, not deleted.
- **Unpublish** — the action of returning a published post to draft.
- **Delete** — hard removal of a post; cannot be undone.
