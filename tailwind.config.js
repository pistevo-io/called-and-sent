export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mission: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        faith: {
          gold: '#d4af37',
          cream: '#faf8f3',
          sage: '#9ca986',
        },
        // Semantic aliases (BRAND.md dark theme). Map the missing tokens used
        // across the app to their real Tailwind gray equivalents so utilities
        // such as bg-background, text-foreground, bg-card, border-border and
        // text-muted-foreground actually emit CSS.
        background: '#111827', // gray-900 — page background
        foreground: '#ffffff', // white — text primary
        card: '#1f2937', // gray-800 — surfaces, panels
        border: '#374151', // gray-700 — dividers, borders
        'muted-foreground': '#9ca3af', // gray-400 — secondary text
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
