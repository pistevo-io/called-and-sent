import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/mine.png'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB
        cleanupOutdatedCaches: true,
        // Denylist auth-gated routes from the precache/navigation fallback
        navigateFallbackDenylist: [/^\/(login|register|profile|dashboard)/],
        runtimeCaching: [
          // Navigation routes — NetworkFirst for offline SPA support
          // Auth paths are excluded via navigateFallbackDenylist above
          {
            urlPattern: ({ request }: { request: { mode: string } }) =>
              request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-pages',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
          // Google Fonts stylesheets
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
          // Google Fonts webfonts
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
          // Fontshare API fonts
          {
            urlPattern: /^https:\/\/api\.fontshare\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'fontshare',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
          // Mapbox tiles
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/styles\/.*\/tiles\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mapbox-tiles',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 14, // 14 days
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
          // Mapbox telemetry
          {
            urlPattern: /^https:\/\/events\.mapbox\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mapbox-events',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
          // Local app images (anchored to production origin)
          {
            urlPattern: /^https:\/\/calledandsent\.me\/images\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
          // Cloudflare Turnstile
          {
            urlPattern: /^https:\/\/challenges\.cloudflare\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'turnstile',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Called & Sent - Mission Journeys',
        short_name: 'Called & Sent',
        description:
          'Follow our Christian mission journeys around the world',
        theme_color: '#0284c7',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  appType: 'spa',
  build: {
    // @neondatabase/auth-ui is a single monolithic UI kit (~560 kB minified)
    // that cannot be split further without circular chunk errors (it imports
    // neon-js which re-exports auth-ui pieces). Isolate it in its own vendor
    // chunk and raise the warning ceiling for that known vendor size.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Vendor chunking: keep the eager entry (landing + profile router) lean
        // by isolating heavy third-party deps into long-cacheable chunks. Route
        // components are already split via React.lazy in App.tsx.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@neondatabase')) return 'vendor-auth';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/') || id.includes('react/jsx-runtime')) {
            return 'vendor-react';
          }
          return undefined;
        },
      },
    },
  },
})
