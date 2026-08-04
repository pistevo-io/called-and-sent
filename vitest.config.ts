import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Isolated test config (does NOT load the production PWA plugin).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
