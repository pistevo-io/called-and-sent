# Called & Sent — Agent Contracts

Horizontal feature structure. Each feature is an independent workstream.
Agents own one feature directory and never touch another feature's code.

## Directory Map

```
src/
├── features/
│   ├── landing/       # Marketing landing page (/)
│   ├── auth/          # Login, signup, auth client (/login, /signup)
│   ├── profile/       # Public profile + dashboard (/:slug)
│   ├── legal/         # Privacy policy, terms (/privacy, /terms)
│   └── settings/      # User settings (TBD)
├── shared/            # Cross-feature: types, data, UI components, hooks
│   ├── ui/            # Footer, shared components
│   ├── types/         # MissionTrip, shared interfaces
│   ├── data/          # Static data (to be replaced by DB)
│   └── hooks/         # useCountUp, shared hooks
├── App.tsx            # Router only — imports from features/
├── main.tsx           # Entry point + auth provider
└── index.css          # Global styles
```

## Agent Boundaries

### Rule 1: One feature per agent
An agent working on profile never touches auth/, landing/, or legal/.
An agent working on auth never touches profile/, etc.

### Rule 2: Shared imports only
Features import from:
- Their own directory (./ComponentName)
- ../../shared/* (types, data, hooks, ui)
- External packages (react, lucide-react, framer-motion, etc.)
- Other features through App.tsx routing only — never by direct import

### Rule 3: App.tsx is the integration point
Only App.tsx imports from multiple features. It's the router — thin, no logic.

### Rule 4: Shared is read-only for agents
Shared code changes require review. Agents can USE shared code but should not
modify it without explicit instruction.

## Feature Contracts

### landing/
- **Route:** `/`
- **Exports:** `LandingPage` (default)
- **Depends on:** `shared/ui/Footer`
- **State:** Marketing page, no auth required

### auth/
- **Routes:** `/login`, `/signup`
- **Exports:** `LoginPage`, `SignupPage`, `authClient`
- **Internal:** `auth.ts` — Neon Managed Better Auth client
- **Depends on:** Nothing in shared (uses external @neondatabase packages)
- **State:** Public pages, no auth required to view

### profile/
- **Route:** `/:slug` (via ProfileRouter)
- **Exports:** `ProfileRouter`, `ProfilePage`, `Dashboard`, `TripModal`, `AboutModal`, `SupportModal`, `MissionMap`
- **Depends on:** `shared/types/MissionTrip`, `shared/data/missionTrips`, `shared/ui/Footer`, `shared/hooks/useCountUp`, `features/auth/auth` (authClient)
- **State:** Auth-protected. Redirects to /login if no session.

### legal/
- **Routes:** `/privacy`, `/terms`
- **Exports:** `PrivacyPolicy`, `TermsOfService`
- **Depends on:** Nothing
- **State:** Public pages

## Adding a New Feature

1. Create `src/features/<name>/`
2. Build components — only import from `../../shared/` or `./`
3. Add route in `App.tsx`
4. Feature is immediately parallelizable — any agent can work on it

## Tech Stack
- React 19 + Vite + TypeScript
- Tailwind CSS 3
- Framer Motion
- Lucide React
- Mapbox GL JS (MissionMap — excluded from strict TS checks)
- Neon Managed Better Auth (@neondatabase/neon-js, @neondatabase/auth-ui)
- React Router v6 (BrowserRouter)

## Commands
```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # TypeScript + Vite production build
npm run lint     # ESLint
```
