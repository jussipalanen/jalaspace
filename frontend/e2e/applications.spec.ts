import { expect, test, type Page } from '@playwright/test'
import { expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

const count = (page: Page) => page.locator('.list-toolbar__count')

test.describe('applications', () => {
  test('opens from the sidebar, filters survive a reload, and a decision is saved', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Applications, 3 new' }).click()
    await expectPageHeading(page, 'Applications')
    await expect(count(page)).toHaveText('8 applications')

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

    // Lotta's application is no longer new, so the sidebar count goes down.
    const navigation = page.getByRole('navigation', { name: 'Main navigation' })
    await expect(navigation.getByRole('link', { name: 'Applications, 2 new' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('region', { name: 'Status' })).toContainText('Rejected')
    await page.goto('/applications?status=open&property=property-helsinki-kallio')
    await expect(count(page)).toHaveText('1 application')
  })

  test('approving leads to a tenant and a lease, and the space is then occupied', async ({ page }) => {
    await page.goto('/applications/application-4')
    await expectPageHeading(page, 'Oskari Esimerkki')
    await page.getByRole('region', { name: 'Status' }).getByRole('button', { name: 'Approve' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Approve' }).click()

    await expectPageHeading(page, 'New lease')
    await expect(page.getByRole('combobox', { name: 'Tenant' }).locator('option:checked')).toHaveText(
      'Oskari Esimerkki',
    )
    // Moving in today makes the lease active, so the space becomes occupied.
    const today = new Date()
    await page
      .getByRole('textbox', { name: /^Start date/ })
      .fill(`${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`)
    await page.getByLabel('Monthly rent (€)').fill('1100')
    await page.getByRole('button', { name: 'Save lease' }).click()

    await expect(page.getByText('The lease of A 11 for Oskari Esimerkki was created.')).toBeVisible()
    await expectPageHeading(page, 'Oskari Esimerkki')
    await expect(page.getByRole('region', { name: 'Status' })).toContainText('Approved')

    await page.goto('/units?property=property-helsinki-kallio&q=A 11')
    await expect(page.getByRole('row', { name: /A 11/ })).toContainText('Occupied')
    await page.goto('/apply')
    await expect(page.getByRole('link', { name: /^Apply for A 11/ })).toHaveCount(0)
  })
})

