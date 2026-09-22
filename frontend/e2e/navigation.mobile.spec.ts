import { expect, test } from '@playwright/test'
import { expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

test.describe('mobile navigation drawer', () => {
  test('is hidden until opened from the menu button', async ({ page }) => {
    await page.goto('/')
    const menuButton = page.getByRole('button', { name: 'Open navigation' })
    const sidebar = page.getByRole('complementary', { name: 'Sidebar' })

    await expect(sidebar).toBeHidden()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    await menuButton.click()

    await expect(sidebar).toBeVisible()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')
  })

  test('closes after choosing a link', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await page
      .getByRole('complementary', { name: 'Sidebar' })
      .getByRole('link', { name: 'Tenants', exact: true })
      .click()

    await expect(page).toHaveURL('/tenants')
    await expectPageHeading(page, 'Tenants')
    await expect(page.getByRole('complementary', { name: 'Sidebar' })).toBeHidden()
  })

  test.describe('closes with', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: 'Open navigation' }).click()
      await expect(page.getByRole('complementary', { name: 'Sidebar' })).toBeVisible()
    })

    test('the close button', async ({ page }) => {
      await page.getByRole('button', { name: 'Close navigation' }).click()
      await expect(page.getByRole('complementary', { name: 'Sidebar' })).toBeHidden()
    })

    test('the Escape key', async ({ page }) => {
      await page.keyboard.press('Escape')
      await expect(page.getByRole('complementary', { name: 'Sidebar' })).toBeHidden()
    })

    test('a tap on the backdrop', async ({ page }) => {
      // Tap to the right of the 248px drawer.
      await page.mouse.click(350, 400)
      await expect(page.getByRole('complementary', { name: 'Sidebar' })).toBeHidden()
    })
  })
})
