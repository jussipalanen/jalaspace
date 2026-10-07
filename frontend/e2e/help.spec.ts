import { expect, test } from '@playwright/test'
import { expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

test.describe('user handbook', () => {
  test('is read chapter by chapter from the sidebar', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('complementary', { name: 'Sidebar' }).getByRole('link', { name: 'Handbook' }).click()

    await expect(page).toHaveURL('/help')
    await expectPageHeading(page, 'Handbook')
    await page.getByRole('navigation', { name: 'Contents' }).getByRole('link', { name: 'Properties' }).click()

    await expect(page).toHaveURL('/help/properties')
    await expectPageHeading(page, 'Properties')
    await expect(page.getByText('Chapter 3 of 10')).toBeVisible()

    await page.getByRole('link', { name: /Next chapter/ }).click()
    await expectPageHeading(page, 'Spaces')
    // The next chapter opens at its top.
    await expect(page.getByText('Chapter 4 of 10')).toBeInViewport()

    await page.reload()
    await expectPageHeading(page, 'Spaces')
  })

  test('the help button opens the chapter of the current page', async ({ page }) => {
    await page.goto('/maintenance')
    await expectPageHeading(page, 'Maintenance')

    await page.getByRole('link', { name: 'Help for this page' }).click()
    await expect(page).toHaveURL('/help/maintenance')
    await expectPageHeading(page, 'Maintenance')
    await page.getByRole('link', { name: 'Open Maintenance' }).first().click()
    await expect(page).toHaveURL('/maintenance')

    await page.goto('/maintenance/new')
    await expectPageHeading(page, 'Add maintenance task')
    await page.getByRole('link', { name: 'Help for this page' }).click()
    await expect(page).toHaveURL('/help/maintenance#add')
    await expect(page.getByRole('heading', { level: 2, name: 'Adding a task' })).toBeInViewport()
  })

  test('keeps the chapter when the language changes', async ({ page }) => {
    await page.goto('/help/leases')
    await expectPageHeading(page, 'Leases')

    await page.getByRole('combobox', { name: 'Language' }).selectOption('fi')

    await expectPageHeading(page, 'Vuokrasopimukset')
    await expect(page).toHaveURL('/help/leases')
    await expect(page.locator('html')).toHaveAttribute('lang', 'fi')
    await expect(page.getByRole('link', { name: 'Tämän sivun ohje' })).toBeVisible()

    await page.reload()
    await expectPageHeading(page, 'Vuokrasopimukset')
  })
})
