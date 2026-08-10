# Mission Journeys

A modern, interactive web application showcasing Christian mission trips around the world with an engaging map interface and beautiful dashboard.

## Features

- **Interactive 3D Map**: Powered by Mapbox GL JS with satellite imagery and terrain
- **Custom Markers**: Animated markers for each mission location
- **Trip Details Modal**: Beautiful slideshow with images, stories, and highlights
- **Dashboard View**: Statistics, timeline, and trip cards
- **Modern Design**: Faith-inspired color palette with smooth animations
- **Responsive**: Works beautifully on all devices

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file from the template and fill in your values:

```bash
cp .env.example .env
```

The two variables that actually matter for a working local app:

```bash
VITE_MAPBOX_TOKEN=pk.your_actual_mapbox_token_here   # map tiles (public)
VITE_NEON_AUTH_URL=https://your-project.neon.auth    # Better Auth origin — WITHOUT THIS, LOGIN IS DEAD
```

`VITE_NEON_AUTH_URL` is required for auth: the app builds and the login page
renders without it, but sessions never resolve and dashboard/profile routes
redirect to `/login` forever. There is also `VITE_TURNSTILE_SITE_KEY` for the
contact form (leave it blank to use the bundled key).

Full reference — every variable, R2/D1/Neon notes, running the Functions stack,
and the dev-over-LAN HTTPS tip: **[docs/dev.md](docs/dev.md)**.

### 3. Run

```bash
npm run dev
```

The application will open at `http://localhost:5173`.

> Dev over LAN? Browsers treat `http://localhost` as a secure context, but a
> LAN IP (e.g. `http://192.168.x.x:5173`) is not — the auth client crashes on
> `crypto.randomUUID` there. Serve the dev server over HTTPS or stick to
> localhost. See [docs/dev.md](docs/dev.md) for `mkcert`/tunnel options.

## Customizing Your Mission Trips

Edit `src/data/missionTrips.ts` to add your own mission trips:

```typescript
{
  id: 'unique-id',
  location: 'City Name',
  country: 'Country',
  coordinates: { lng: longitude, lat: latitude },
  date: 'Month Year',
  duration: 'X weeks/days',
  title: 'Mission Title',
  description: 'Brief description',
  story: 'Your mission story...',
  images: ['image-url-1', 'image-url-2'],
  highlights: ['Achievement 1', 'Achievement 2'],
  peopleReached: 500,
  ministryType: ['Type 1', 'Type 2'],
}
```

### Finding Coordinates

Use [LatLong.net](https://www.latlong.net/) to find coordinates for your locations.

### Image Sources

- Use your own images hosted on a service like Cloudinary, Imgur, or AWS S3
- Or use placeholder images from Unsplash as shown in the example

## Tech Stack

- **React 18** with TypeScript
- **Vite** for blazing fast builds
- **Mapbox GL JS** for modern 3D maps
- **Tailwind CSS** for styling
- **Framer Motion** for smooth animations
- **Lucide React** for beautiful icons

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` folder, ready to deploy to any static hosting service like:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## Color Customization

The faith-inspired color palette is defined in `tailwind.config.js`. Customize the colors to match your branding:

```javascript
colors: {
  mission: { /* Blue palette */ },
  faith: {
    gold: '#d4af37',
    cream: '#faf8f3',
    sage: '#9ca986',
  }
}
```
