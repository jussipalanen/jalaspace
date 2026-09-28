import { expect, test, type Page } from '@playwright/test'
import { expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

const count = (page: Page) => page.locator('.list-toolbar__count')

test.describe('applications', () => {
  test('opens from the sidebar, filters survive a reload, and a decision is saved', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Applications' }).click()
    await expectPageHeading(page, 'Applications')
    await expect(count(page)).toHaveText('7 applications')

    await page.getByLabel('Status').selectOption({ label: 'Open (submitted or in review)' })
    await page.getByLabel('Property').selectOption({ label: 'Helsinki Kallio Residences' })
    await expect(count(page)).toHaveText('2 applications')
    await page.reload()
    await expect(count(page)).toHaveText('2 applications')

    await page.getByRole('link', { name: 'Lotta Esimerkki' }).click()
    await expectPageHeading(page, 'Lotta Esimerkki')
    const status = page.getByRole('region', { name: 'Status' })
    await status.getByRole('button', { name: 'Start review' }).click()
    await expect(page.getByText('The application of Lotta Esimerkki is now in review.')).toBeVisible()
    await status.getByRole('button', { name: 'Reject' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Reject application' }).click()
    await expect(status).toContainText('Rejected')

    await page.reload()
    await expect(page.getByRole('region', { name: 'Status' })).toContainText('Rejected')
    await page.goto('/applications?status=open&property=property-helsinki-kallio')
    await expect(count(page)).toHaveText('1 application')
  })
})
