import { expect, test, type Page } from '@playwright/test'
import { expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

const count = (page: Page) => page.locator('.list-toolbar__count')
const occupancy = (page: Page) =>
  page.getByRole('region', { name: 'Key figures' }).getByRole('link', { name: /^Occupancy/ })

test.describe('tenants', () => {
  test('filters survive a reload and the dashboard links to tenant details', async ({ page }) => {
    await page.goto('/tenants')
    await expect(count(page)).toHaveText('31 tenants')
    await page.getByLabel('Type').selectOption({ label: 'Person' })
    await page.getByRole('searchbox', { name: 'Search tenants' }).fill('aino')
    await expect(count(page)).toHaveText('1 tenant')

    await page.reload()
    await expect(count(page)).toHaveText('1 tenant')
    await page.getByRole('link', { name: 'Aino Esimerkki' }).click()
    await expectPageHeading(page, 'Aino Esimerkki')
    await expect(page.getByRole('region', { name: 'Spaces' })).toContainText('A 1')
  })

  test('adds a tenant, assigns and removes a space, and the space status follows', async ({ page }) => {
    await page.goto('/')
    await expect(occupancy(page)).toContainText('85%')

    await page.goto('/tenants/new')
    await page.getByRole('textbox', { name: 'Company name' }).fill('Pohjola Bakery Oy')
    await page.getByRole('textbox', { name: 'Contact person' }).fill('Liisa Esimerkki')
    await page.getByRole('textbox', { name: 'Email' }).fill('hello@pohjola-bakery.example')
    await page.getByRole('button', { name: 'Save tenant' }).click()
    await expect(page.getByText('Tenant Pohjola Bakery Oy was added.')).toBeVisible()
    await expectPageHeading(page, 'Pohjola Bakery Oy')

    await page.getByRole('link', { name: 'Assign to space' }).click()
    await expectPageHeading(page, 'New lease')
    await expect(page.getByRole('combobox', { name: 'Tenant' }).locator('option:checked')).toHaveText(
      'Pohjola Bakery Oy',
    )
    await page.getByRole('combobox', { name: 'Property' }).selectOption({ label: 'Kuopio Harbour Business Park' })
    await page.getByRole('combobox', { name: 'Space' }).selectOption({ label: 'B 204 (Available)' })
    await page.getByLabel('Monthly rent (€)').fill('1 250,50')
    await page.getByRole('button', { name: 'Save lease' }).click()
    await expect(page.getByText('The lease of B 204 for Pohjola Bakery Oy was created.')).toBeVisible()
    await expectPageHeading(page, 'Pohjola Bakery Oy')
    await expect(page.getByRole('region', { name: 'Spaces' })).toContainText('€1,250.50 / month')

    await page.reload()
    await expect(page.getByRole('region', { name: 'Spaces' })).toContainText('B 204')
    await page.goto('/units?property=property-kuopio-harbour&status=occupied')
    const row = page.getByRole('row').filter({ hasText: 'B 204' })
    await expect(row).toContainText('Occupied')
    await expect(row.getByRole('link', { name: 'Pohjola Bakery Oy' })).toBeVisible()
    await page.goto('/')
    await expect(occupancy(page)).toContainText('87%')

    // The lease started today, so removing the tenant cancels it.
    await page.goto('/tenants')
    await page.getByRole('link', { name: 'Pohjola Bakery Oy' }).click()
    await page.getByRole('button', { name: 'Remove from space B 204' }).click()
    await page.getByRole('dialog', { name: 'Cancel the lease of B 204?' }).getByRole('button', { name: 'Cancel lease' }).click()
    await expect(page.getByText('The upcoming lease of B 204 was cancelled.')).toBeVisible()
    await expect(page.getByText('This tenant does not rent any space at the moment.')).toBeVisible()
    await page.goto('/')
    await expect(occupancy(page)).toContainText('85%')

    // With no leases left, the tenant can be deleted.
    await page.goto('/tenants')
    await page.getByRole('link', { name: 'Pohjola Bakery Oy' }).click()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await page.getByRole('dialog', { name: 'Delete Pohjola Bakery Oy?' }).getByRole('button', { name: 'Delete tenant' }).click()
    await expect(page.getByText('Tenant Pohjola Bakery Oy was deleted.')).toBeVisible()
    await expect(count(page)).toHaveText('31 tenants')
  })

  test('moves a tenant out of a space with keyboard only', async ({ page }) => {
    await page.goto('/tenants/tenant-aino-esimerkki')
    await page.getByRole('button', { name: 'Remove from space A 1' }).focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Remove Aino Esimerkki from A 1?' })
    await expect(dialog).toContainText('The tenant moves out today')
    await dialog.getByRole('button', { name: 'Remove from space' }).focus()
    await page.keyboard.press('Enter')

    await expect(page.getByText('Aino Esimerkki was removed from A 1.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Spaces' })).toBeFocused()
    await page.reload()
    await expect(page.getByRole('region', { name: 'Past leases' })).toContainText('A 1')
    await page.goto('/units?property=property-helsinki-kallio')
    const a1 = page.getByRole('row').filter({ has: page.getByRole('link', { name: 'Edit A 1', exact: true }) })
    await expect(a1).toContainText('Available')
  })

  test('explains why a tenant with leases cannot be deleted', async ({ page }) => {
    await page.goto('/tenants/tenant-old-town-books')
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Old Town Books Oy cannot be deleted' })
    await expect(dialog).toContainText('1 lease')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
})
