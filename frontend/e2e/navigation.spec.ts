import { expect, test } from '@playwright/test'
import { expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

test.describe('application navigation', () => {
  const sections = [
    { link: 'Properties', path: '/properties', heading: 'Properties' },
    { link: 'Spaces', path: '/units', heading: 'Spaces' },
    { link: 'Maintenance', path: '/maintenance', heading: 'Maintenance' },
    { link: 'Tenants', path: '/tenants', heading: 'Tenants' },
    { link: 'Leases', path: '/leases', heading: 'Leases' },
    { link: 'Settings', path: '/settings', heading: 'Settings' },
    { link: 'Dashboard', path: '/', heading: 'Dashboard' },
  ]

  test('navigates to every section from the sidebar', async ({ page }) => {
    await page.goto('/')
    const sidebar = page.getByRole('complementary', { name: 'Sidebar' })

    for (const { link, path, heading } of sections) {
      const navLink = sidebar.getByRole('link', { name: link, exact: true })
      await navLink.click()

      await expect(page).toHaveURL(path)
      await expectPageHeading(page, heading)
      await expect(navLink).toHaveAttribute('aria-current', 'page')
    }
  })

  test('opens detail pages from a direct link', async ({ page }) => {
    await page.goto('/tenants/tenant-42')

    await expectPageHeading(page, 'Tenant details')
    await expect(page.getByText('Reference: tenant-42')).toBeVisible()

    await page.getByRole('link', { name: 'Back to tenants' }).click()
    await expectPageHeading(page, 'Tenants')
  })

  test('shows the not-found page for unknown routes', async ({ page }) => {
    await page.goto('/does-not-exist')

    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
    await page.getByRole('link', { name: 'Go to dashboard' }).click()
    await expectPageHeading(page, 'Dashboard')
  })

  test('skip link moves focus to the main content', async ({ page }) => {
    await page.goto('/leases')
    // Wait for the app to render before tabbing into it.
    await expectPageHeading(page, 'Leases')
    await page.keyboard.press('Tab')

    const skipLink = page.getByRole('link', { name: 'Skip to content' })
    await expect(skipLink).toBeFocused()
    await skipLink.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
  })
})
