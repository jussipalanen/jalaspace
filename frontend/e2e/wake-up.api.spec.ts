import { expect, test } from '@playwright/test'
import { E2E_BACKEND_URL } from './fixtures'

// Runs with playwright.api.config.ts (VITE_DATA_PROVIDER=api).

test('starts waking the API on the sign-in page, before anyone signs in', async ({ page }) => {
  const health = page.waitForRequest(`${E2E_BACKEND_URL}/api/health`)
  await page.goto('/login')

  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  expect((await health).method()).toBe('GET')
})
