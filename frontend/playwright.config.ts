import { defineConfig, devices } from '@playwright/test'
import { BLOCK_OPENSTREETMAP } from './e2e/fixtures'

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`
const isCI = Boolean(process.env.CI)
/** Keep in step with `API_URL` in e2e/fixtures.ts. */
const E2E_API_URL = 'http://api.jalaspace.test'

// End-to-end tests run against the production build served by `vite preview`,
// which is the closest local match to the Vercel deployment.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    launchOptions: { args: [BLOCK_OPENSTREETMAP] },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
      // Mobile tests have their own project; API tests their own config (playwright.api.config.ts).
      testIgnore: /\.(mobile|api)\.spec\.ts$/,
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testMatch: /\.mobile\.spec\.ts$/,
    },
  ],
  webServer: {
    // Type checking has its own CI job, so only the Vite build runs here.
    command: `npx vite build && npx vite preview --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    // localStorage data, whatever .env.local says, and a placeholder API; tests
    // that need the API answer its requests with `page.route`.
    env: { VITE_DATA_PROVIDER: 'localStorage', VITE_API_URL: E2E_API_URL },
  },
})
