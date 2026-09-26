import { defineConfig, devices } from '@playwright/test'
import { BLOCK_OPENSTREETMAP } from './e2e/fixtures'

// End-to-end tests of the `api` data provider: the production build talks to
// the real JalaSpace API (backend/), started here with its demo data.
// Run with `npm run test:e2e:api`; the backend's dependencies must be installed.

/** Keep in step with `E2E_BACKEND_URL` in e2e/fixtures.ts. */
const API_PORT = 3100
const APP_PORT = 4174
const API_URL = `http://localhost:${API_PORT}`
const APP_URL = `http://localhost:${APP_PORT}`
const isCI = Boolean(process.env.CI)

export default defineConfig({
  testDir: './e2e',
  testMatch: /\.api\.spec\.ts$/,
  // The API holds one shared dataset, so tests run one at a time and reset it first.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI
    ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report-api' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-api' }]],
  outputDir: 'test-results-api',
  use: {
    baseURL: APP_URL,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
    launchOptions: { args: [BLOCK_OPENSTREETMAP] },
  },
  webServer: [
    {
      command: 'npm --prefix ../backend start',
      url: `${API_URL}/api/health`,
      reuseExistingServer: !isCI,
      timeout: 60_000,
      // No GEMINI_API_KEY: AI suggestions are off, so no test can reach Gemini.
      // Every test resets the data, so the write and reset limits are raised.
      env: {
        PORT: String(API_PORT),
        SEED_DEMO_DATA: 'true',
        CORS_ORIGINS: APP_URL,
        WRITE_RATE_LIMIT: '100000',
        RESET_RATE_LIMIT: '100000',
      },
    },
    {
      // Its own output folder, so it never mixes with the localStorage E2E build in dist/.
      command: `npx vite build --outDir dist-e2e-api && npx vite preview --outDir dist-e2e-api --port ${APP_PORT} --strictPort`,
      url: APP_URL,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      // Set here, so values in .env.local cannot point the tests somewhere else.
      env: { VITE_DATA_PROVIDER: 'api', VITE_API_URL: API_URL },
    },
  ],
})
