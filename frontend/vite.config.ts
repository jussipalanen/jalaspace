/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Playwright specs in e2e/ are run by `npm run test:e2e`, not Vitest.
    include: ['src/**/*.test.{ts,tsx}'],
    // Fixed here, so a developer's .env.local (e.g. VITE_DATA_PROVIDER=api with a
    // real API URL) cannot make tests read or change real data. Tests that need
    // other values stub them with vi.stubEnv.
    env: { VITE_DATA_PROVIDER: 'localStorage', VITE_API_URL: '' },
  },
})
