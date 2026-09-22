import { expect, type Page } from '@playwright/test'

export const DEMO_EMAIL = 'demo@jalaspace.app'
export const DEMO_PASSWORD = 'demo'
export const SESSION_KEY = 'jalaspace_session'
/** The placeholder API URL the E2E build uses (see playwright.config.ts). */
export const API_URL = 'http://api.jalaspace.test'

/**
 * Browser storage state with a signed-in demo session, for tests that
 * don't exercise the sign-in flow itself.
 */
export function signedInState(baseURL: string) {
  return {
    cookies: [],
    origins: [
      {
        origin: new URL(baseURL).origin,
        localStorage: [
          {
            name: SESSION_KEY,
            value: JSON.stringify({
              user: { id: 'demo-user', email: DEMO_EMAIL, name: 'Demo User' },
              createdAt: '2026-09-22T10:30:00.000Z',
            }),
          },
        ],
      },
    ],
  }
}

export async function signIn(page: Page, email = DEMO_EMAIL, password = DEMO_PASSWORD) {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

export async function expectPageHeading(page: Page, name: string) {
  await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible()
}
