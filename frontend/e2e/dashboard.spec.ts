import { expect, test, type Page } from '@playwright/test'
import { expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

const figure = (page: Page, label: string) =>
  page.getByRole('region', { name: 'Key figures' }).getByRole('link', { name: new RegExp(`^${label}`) })

test.describe('dashboard', () => {
  test('shows figures and lists from the seeded demo data', async ({ page }) => {
    await page.goto('/')

    await expect(figure(page, 'Properties')).toContainText('4')
    await expect(figure(page, 'Spaces')).toContainText('7 available')
    await expect(figure(page, 'Occupancy')).toContainText('85%')
    await expect(figure(page, 'Open maintenance')).toContainText('10')

    const maintenance = page.getByRole('region', { name: 'Recent maintenance' })
    await expect(maintenance.getByRole('listitem')).toHaveCount(5)

    const spaces = page.getByRole('region', { name: 'Available spaces' })
    await expect(spaces.getByText(/^Reserved from /)).toBeVisible()

    await expect(
      page.getByRole('region', { name: 'Recent activity' }).getByRole('listitem'),
    ).toHaveCount(6)
  })

  test('opens a maintenance task from the dashboard', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('region', { name: 'Recent maintenance' })
      .getByRole('link', { name: 'Main entrance door closer broken' })
      .click()

    await expect(page).toHaveURL('/maintenance/maintenance-3')
    await expectPageHeading(page, 'Main entrance door closer broken')
  })

  test('recalculates the figures when the data changes', async ({ page }) => {
    await page.goto('/')
    await expect(figure(page, 'Occupancy')).toContainText('85%')

    // Mark every available space as occupied, as a future lease workflow would.
    await page.evaluate(() => {
      const spaces = JSON.parse(localStorage.getItem('jalaspace_units') ?? '[]') as {
        status: string
      }[]
      for (const space of spaces) if (space.status === 'available') space.status = 'occupied'
      localStorage.setItem('jalaspace_units', JSON.stringify(spaces))
    })
    await page.reload()

    await expect(figure(page, 'Occupancy')).toContainText('96%')
    await expect(figure(page, 'Spaces')).toContainText('0 available')
    await expect(page.getByText('All spaces are occupied or in maintenance.')).toBeVisible()
  })
})
