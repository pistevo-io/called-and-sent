# Spec: Wall post lifecycle + private dashboard manager

## Problem Statement

Missionary profiles have no real posting workflow today. Wall posts are
immediately public the moment they're created — the owner cannot write
privately, cannot control what goes live, cannot unpublish or archive, cannot
attach more than text, and visitors get an unfiltered list with no way to
browse by type. The owner wants the familiar social-platform shape: a private
area where they compose and manage posts, and a public profile that shows only
what they chose to publish.

## Solution

Give the wall a full post lifecycle and make the dashboard the private
management surface. Owners write posts as drafts, publish when ready, unpublish
or archive later, and attach multiple images per post. The public profile shows
only published posts — newest first, with filter chips by post type and images
rendered as a carousel. Owners can also edit their public profile identity
(display name, bio, photo, links).

## User Stories

1. As a profile owner, I want to write a post without publishing it, so that I can work on it privately as a draft.
2. As a profile owner, I want to see all my drafts listed in the dashboard, so that I can return to and finish them.
3. As a profile owner, I want to publish a draft, so that it appears on my public wall.
4. As a profile owner, I want to unpublish a published post, so that it returns to drafts and disappears from the public wall.
5. As a profile owner, I want to archive a post, so that it is removed from the public wall but retained.
6. As a profile owner, I want to delete a post permanently, so that it is gone for good.
7. As a profile owner, I want to attach multiple images to a post, so that I can share more than one photo.
8. As a profile owner, I want my post's images shown as a carousel, so that viewers see them one at a time.
9. As a visitor, I want to see only published posts on a profile's wall, so that I never see drafts or archived content.
10. As a visitor, I want to filter the wall by post type, so that I can focus on testimonies, prayer requests, or other types.
11. As a profile owner, I want to edit my display name, bio, and photo, so that my public profile reflects who I am.
12. As a profile owner, I want to add up to four links (website and socials), so that visitors can find me elsewhere.
13. As a profile owner, I want a post manager in the dashboard with Draft / Published / Archived views, so that I can organize my content.
14. As a profile owner, I want a title to be optional on a post, so that image-first posts stay clean.
15. As a profile owner, I want to tag each post with a type (testimony / prayer / update / praise / scripture), so that visitors can browse by it.
16. As a visitor, I want the wall newest-first, so that fresh updates are easy to spot.
17. As a profile owner, I want drafts and archived posts visible only to me, so that my private content never leaks to the public wall.

## Implementation Decisions

- **Post lifecycle lives on the row** (ADR-0001): a `status` field on the post
  record (`draft | published | archived`). Deleted means hard-deleted. There is
  no scheduled state.
- **Schema changes**: the posts table gains `status` (existing rows backfilled
  to `published` so nothing already live disappears); a sibling post-images
  table holds ordered image references per post; the profile record gains a
  links block (up to four).
- **Public reads are filtered once**: every public wall query goes through a
  single published-only lookup for a profile, so the filter is written in one
  place and drafts cannot leak. Owner reads (dashboard) return all statuses for
  their own profile.
- **API surface**: the wall-posts endpoint gains lifecycle transitions (publish,
  unpublish, archive) and multi-image create/update; the public list endpoint
  returns published posts with their images; the profile endpoint gains links.
  Writes stay scoped to the authenticated owner.
- **Frontend**: the dashboard wall tab becomes a post manager with status views
  and a compose flow that supports multiple images; the public wall renders the
  carousel and type filter chips; the dashboard profile editor gains the links
  block.
- **Vocabulary**: use the glossary terms from `CONTEXT.md` (Post, Wall, Draft,
  Published, Archived, Unpublish, Delete) in UI copy, tests, and issue titles.

## Testing Decisions

- A good test verifies behavior at the public boundary — what the API accepts
  and returns — never implementation internals.
- **Primary seam: the wall-posts API.** Tests cover lifecycle transitions
  (draft → published → draft → archived), ownership scoping (a user cannot
  mutate another's post), and the public filter (drafts/archived never appear
  on public reads). This introduces the repo's first API test harness
  (vitest + miniflare against the D1 schema).
- **Secondary seam: the dashboard post manager.** Component tests follow the
  existing public-profile regression pattern (mocked auth session + mocked API
  client) — publish/unpublish/archive buttons drive the right API calls and the
  status views render.
- **Prior art:** the public profile regression test and the profile API-client
  test; the new API harness is the only new pattern.

## Out of Scope

- Engagement: likes, comments, shares, reactions.
- Network: following, subscriptions, notifications, feeds of other users.
- Scheduled publishing (explicitly rejected in the design session).
- Rich text, video, or audio in posts.
- Owner-only content types beyond drafts and archived posts (no private notes,
  no private prayer lists).
- Multiple profiles per account, teams, co-editors, profile transfer.
- Theme customization beyond the existing default.

## Further Notes

- Image cap for a post is nine; carousel, one image at a time.
- The links block is limited to four entries (website + socials).
- Deployment note: the live site (calledandsent.me) runs on a different
  Cloudflare account than the one owning D1/R2; this work targets the D1-backed
  environment.
