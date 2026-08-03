# Called & Sent — Brand Guidelines

## Brand Name

**Called & Sent**

From Matthew 28:19-20 — "Therefore go and make disciples of all nations..."

The name speaks to the dual reality of every missionary: **called** by God, **sent** by the Spirit. It's personal. It's theological. It's universal across denominations and mission fields.

---

## Brand Promise

A dignified, beautiful home on the web for every missionary's calling, work, and story.

---

## Visual Identity

### Primary Colors

| Name | Hex | Tailwind | Use |
|------|-----|----------|-----|
| Mission Blue | `#0284c7` | `mission-600` | Primary CTAs, links, active states |
| Mission Dark | `#0c4a6e` | `mission-900` | Headers, hero backgrounds |
| Mission Light | `#e0f2fe` | `mission-100` | Tags, badges on dark backgrounds |

### Accent Colors

| Name | Hex | Use |
|------|-----|-----|
| Faith Gold | `#d4af37` | Premium features, highlights, supporter badges |
| Faith Sage | `#9ca986` | Secondary stats, subtle accents |
| Faith Cream | `#faf8f3` | Light backgrounds (modals, cards in light mode) |

### Neutrals (Dark Theme)

| Name | Hex | Use |
|------|-----|-----|
| Background | `#111827` (`gray-900`) | Page background |
| Surface | `#1f2937` (`gray-800`) | Cards, panels |
| Border | `#374151` (`gray-700`) | Dividers, card borders |
| Text Primary | `#ffffff` | Headlines |
| Text Secondary | `#9ca3af` (`gray-400`) | Body text, descriptions |
| Text Muted | `#6b7280` (`gray-500`) | Metadata, timestamps |

### Gradients

- **Hero/Header:** `gray-900 → gray-800 → gray-900`
- **CTA Buttons:** `mission-600 → mission-700`
- **Premium/Supporter:** `mission-900 → mission-800 → mission-900`
- **Stats icons:** Mission blue, sage green, purple, red/pink

---

## Typography

### Headings
**Inter** — bold, modern, clean. Weights: 700 (h1), 600 (h2/h3).

### Body
**Inter** — weights 300-400 for reading, 500-600 for emphasis.

### Scripture / Quotes
**Georgia or serif fallback** — italic, slightly larger, set apart from body text.

### Current Usage (index.html)
```css
font-family: 'Inter', sans-serif;  /* body, UI */
```

Additional fonts loaded but not currently in use: Bebas Neue, Montserrat, Raleway, Space Grotesk, Oswald. These should be cleaned up — stick to Inter only.

---

## Iconography

**Lucide React** — consistent stroke-based icons. 24px default, 16px inline.

Key icons by context:
- **Missions/Trips:** Globe, MapPin, Compass
- **Faith/Testimony:** Heart, Cross, BookOpen
- **Support/Partner:** Heart (filled), HandHeart, DollarSign
- **Community:** Users, MessagesSquare, Share2

---

## Brand Voice

### Personality
- **Genuine, not polished.** Real stories from real missionaries. Avoid corporate Christian-ese.
- **Bold, not aggressive.** Proclaim truth confidently but warmly.
- **Simple, not simplistic.** Deep theology in plain language.
- **Joyful, not cheerful.** The joy of the Gospel is deeper than happiness.

### Tone Spectrum
| Context | Tone |
|---------|------|
| Missionary profiles | Personal, testimonial, first-person |
| Trip stories | Narrative, vivid, specific |
| Platform UI | Clear, helpful, minimal |
| Marketing/landing | Inspiring, inviting, warm |
| Error messages | Humble, helpful, direct |

### Words We Use
- "missionary" not "field worker" or "ministry partner"
- "trip" or "mission" not "project" or "deployment"
- "partner" or "support" not "donate" (sounds transactional)
- "calling" not "career" or "role"
- "the Gospel" or "the Good News" — never abbreviated or genericized
- "wall" for the public post feed (familiar, approachable)

### Words We Avoid
- Corporate jargon (leverage, synergy, scalable, ecosystem)
- Christian clichés (blessed and highly favored, walking in your season)
- Overly emotional manipulation (tear-jerking without substance)
- "Impact" as a standalone metric (quantify it: lives changed, people reached)

---

## Logo Direction

**Current:** No formal logo. Just "Called & Sent" in Inter bold + a scripture tagline.

**Direction for SaaS:**
- Wordmark: "Called & Sent" with a subtle cross or compass element
- Icon/favicon: A stylized "C&S" or a compass-cross mark
- Keep it simple — the platform name does the work

No logo design work needed yet. TBD when we build the landing page.

---

## UI Patterns

### Buttons
- **Primary:** `bg-mission-600 hover:bg-mission-700 text-white rounded-full` (solid)
- **Secondary:** `border border-mission-500 text-mission-300 hover:bg-mission-600/20 rounded-full` (ghost)
- **Premium:** `bg-gradient-to-r from-faith-gold to-amber-500 text-gray-900` (gold gradient)

### Cards
- `bg-gray-800 border border-gray-700 rounded-2xl shadow-lg`
- Hover: `hover:shadow-xl hover:shadow-mission-500/20 hover:border-mission-500 hover:-translate-y-1`

### Modals
- `bg-white rounded-2xl shadow-2xl` with dark gradient hero image at top
- Light content area below for readability

### Tags/Badges
- Ministry types: `bg-mission-600/30 border border-mission-500 text-mission-300 rounded-full`
- Status: `bg-mission-600 text-white rounded-full` (upcoming), muted for completed

---

## Motion

- **Framer Motion** for all animations
- Page entrances: fade + slide up (y: 20 → 0), staggered by 0.1s
- Card hovers: scale 1.02 + shadow increase, 300ms ease
- Modals: spring animation (damping: 25, stiffness: 300)
- Map markers: ping animation + hover scale(1.25)

**Principle:** Motion should feel calm and deliberate, not flashy. Mission work is weighty. Animations should feel like turning pages, not a video game.

---

## Photography Style

- Real, not stock. Actual mission field photos.
- Warm, natural light. No heavy filters.
- People over places. Faces, hands, interactions.
- Dignity always. The people being served are not props.
