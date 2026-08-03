# Called & Sent — SaaS Product Idea

**One-liner:** A platform where missionaries build beautiful portfolio/support pages to share their calling, document trips, post faith journey updates, and receive prayer/financial partnership — like a mission-focused Carrd/Linktree.

---

## Problem

Missionaries cobble together support raising across Instagram, WhatsApp, email, and maybe a static site. No purpose-built tool exists where they can:
- Showcase their calling and testimony with dignity
- Document mission trips with rich media, maps, and stories
- Post faith journey updates, testimonies, prayer requests in one feed
- Collect prayer and financial support in one place
- Share a single link that represents their entire ministry
- Send newsletter updates to supporters

## Solution

A SaaS where each missionary gets a profile at `calledandsent.me/username`:
- Customizable profile page (photo, testimony, calling)
- Trip portfolio with maps, galleries, stories, stats
- Faith journey wall (testimonies, updates, prayer requests)
- Support hub (prayer signup, giving links, contact form)
- Newsletter system (premium)
- Rich block editor for all content (drag-and-drop, Notion-style)

---

## Profile Serving

All profiles served via path-based routing: `calledandsent.me/username`

- Single Vite React app on Cloudflare Pages
- D1 used as read-through cache layer for public profiles
- Primary database: **Neon** (serverless Postgres)
- R2 for uploaded images/media
- Profile data fetched from Neon, cached in D1/KV for fast public reads

No subdomains. No custom domains. Simpler routing, simpler SSL, simpler everything.

---

## Pricing Philosophy

**The platform itself is free.** Missionaries shouldn't pay to share the Gospel.

Monetization comes from:
1. Premium features (newsletter, advanced editor, analytics)
2. Voluntary platform support ($5/mo "Keep Called & Sent Alive")
3. Optional donation platform fee (if we process gifts)

This aligns with the mission: remove friction for missionaries, make money from power users and generosity.

---

## Tier Structure

### Free ($0)
Everything a missionary needs to get started:
- 1 profile page at `calledandsent.me/username`
- Unlimited mission trips with images, maps, stories
- Faith journey wall (unlimited posts, text + images)
- Block editor (full drag-and-drop, Notion-style)
- Contact form (Turnstile-protected)
- Prayer request section
- Financial giving links (external — link to their own PayPal, church giving page, etc.)
- 2 themes (light/dark)
- Basic analytics (page views)
- "Powered by Called & Sent" footer

### Premium ($9/mo or $90/yr)
Power features for serious missionary communicators:
- **Newsletter** — unlimited subscribers, rich HTML editor, templates, scheduling, open/click analytics
- **Custom domain** — map their own domain to their profile
- **Advanced analytics** — geography, referral sources, popular content
- **Scheduled wall posts** — write now, publish later
- **Auto social share** — new posts auto-post to Instagram/Facebook
- **Video embeds** — YouTube/Vimeo in trip stories and wall posts
- **File attachments** — PDF prayer letters, support documents on profile
- **Remove "Powered by Called & Sent"**
- **Priority support**

### Supporter ($5/mo — NOT a feature tier)
For people who believe in the mission of the platform:
- No extra features
- Badge on their profile: "Platform Supporter"
- Warm fuzzy feeling of keeping the lights on
- 100% optional, never nagged

---

## Feature Matrix

| Feature | Free | Premium ($9) | Supporter ($5) |
|---------|------|-------------|----------------|
| Profile page | ✓ | ✓ | ✓ |
| Unlimited trips | ✓ | ✓ | ✓ |
| Faith wall (unlimited posts) | ✓ | ✓ | ✓ |
| Full block editor + drag-and-drop | ✓ | ✓ | ✓ |
| 2 themes | ✓ | ✓ | ✓ |
| Contact form | ✓ | ✓ | ✓ |
| Prayer requests | ✓ | ✓ | ✓ |
| External giving links | ✓ | ✓ | ✓ |
| Basic analytics | ✓ | ✓ | ✓ |
| Newsletter | ✗ | ✓ | ✗ |
| Custom domain | ✗ | ✓ | ✗ |
| Advanced analytics | ✗ | ✓ | ✗ |
| Scheduled posts | ✗ | ✓ | ✗ |
| Auto social share | ✗ | ✓ | ✗ |
| Video embeds | ✗ | ✓ | ✗ |
| File attachments | ✗ | ✓ | ✗ |
| Remove branding | ✗ | ✓ | ✗ |
| Priority support | ✗ | ✓ | ✗ |
| Supporter badge | ✗ | ✗ | ✓ |

---

## Content Editor

**TipTap** (ProseMirror-based) for all rich content. Available to ALL users — this is not paywalled.

- Block-based: paragraphs, headings, images, lists, quotes, callouts
- Drag-and-drop reordering of blocks
- Markdown shortcuts (type `#` for heading, `-` for list)
- Image upload → R2, CDN delivery
- Trip story editor, wall post editor, bio editor — all the same engine

Premium adds: video embeds, file attachment blocks.

---

## Faith Journey Wall

Each profile has a "Wall" — chronological posts visible on their public page.

**Post types:** Testimony, prayer request, trip field update, praise report, scripture reflection.

All features available to Free users. Premium adds: scheduling, auto-social-share.

---

## Newsletter (Premium Only)

This is the primary premium feature. Missionaries collect subscribers from their profile and send updates.

- Subscriber collection form embed on profile
- Unlimited subscribers
- Rich HTML editor (TipTap, simplified for email-safe output)
- 5 email templates
- Scheduled sends
- Open/click analytics
- Subscriber export

**Sending infra:** MailChannels for outbound (free via Cloudflare integration) or Resend for better deliverability.

---

## Technical Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | React 19 + Vite + TypeScript | Already built, fast, modern |
| Styling | Tailwind CSS | Already built |
| Editor | TipTap (ProseMirror) | Best React rich text editor, block-based |
| Hosting | Cloudflare Pages | Already deployed, global CDN, free tier generous |
| Primary DB | **Neon** (serverless Postgres) | Scale-to-zero, branching, generous free tier |
| Auth | **Neon Managed Better Auth** | Free up to 60K MAU, built into Neon, OAuth providers |
| File storage | Cloudflare R2 | S3-compatible, no egress fees |
| Cache | Cloudflare D1 + KV | D1 for relational cache, KV for fast key-value |
| Payments | Stripe (subscriptions) | Battle-tested, handles recurring billing |
| Newsletter send | MailChannels (free) / Resend | Free tier viable, Resend for premium deliverability |
| Email templates | React Email | Modern, React-based email templates |
| Maps | Mapbox GL JS | Already integrated |
| Spam protection | Cloudflare Turnstile | Already integrated, free |

---

## Neon Pricing Reality Check

| Resource | Free Tier Limit | Our Projected Use (100 missionaries) |
|----------|----------------|--------------------------------------|
| Auth MAU | 60,000 | ~500-1000 (tiny) |
| Compute | 100 CU-hrs/mo | ~20-50 CU-hrs |
| Storage | 0.5 GB | ~100-200 MB |
| Branches | 10 | 3 (dev, staging, prod) |

**We stay on the Free plan for a long time.** Even at 1,000 missionaries, we're well within limits. Only need Launch ($15/mo typical) when storage/compute grows.

---

## What We Don't Build (Yet)

- Church/org dashboards — V2
- Donation processing (Stripe Connect) — V2
- Missionary discovery/browse — V2
- Merch store — V2
- Mobile app — PWA first, native later
- Multi-language — V2

---

## Migration Path from Current Site

1. **Phase 1:** Add Neon DB + Auth. Convert current hardcoded trip data to database-backed. Mr. K becomes first user.
2. **Phase 2:** Build profile editor dashboard (`/dashboard`). TipTap integration.
3. **Phase 3:** Multi-tenant routing (`calledandsent.me/username`). Signup flow.
4. **Phase 4:** Stripe subscriptions for Premium + Supporter tiers.
5. **Phase 5:** Newsletter engine.

---

## Open Questions

- Denominational/doctrinal vetting? Or open platform?
- How to handle missionaries in creative-access countries (security/privacy mode)?
- PWA-first or eventual mobile app?
- Supporter tier: one-time donation option too, or subscription only?
