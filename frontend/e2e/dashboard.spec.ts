import { expect, test, type Page } from '@playwright/test'
import { expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

const occupancy = (page: Page) => figure(page, 'Occupancy')
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
    await expect(occupancy(page)).toContainText('85%')
    await expect(figure(page, 'Spaces')).toContainText('7 available')

    // A 1's lease ends yesterday. On the next start the app frees the space,
    // and the figures follow.
    await page.evaluate(() => {
      const leases = JSON.parse(localStorage.getItem('jalaspace_leases') ?? '[]') as {
        id: string
        endDate: string | null
      }[]
      const date = new Date()
      date.setDate(date.getDate() - 1)
      const yesterday = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      for (const lease of leases) if (lease.id === 'lease-45') lease.endDate = yesterday
      localStorage.setItem('jalaspace_leases', JSON.stringify(leases))
    })
    await page.reload()

    await expect(occupancy(page)).toContainText('84%')
    await expect(figure(page, 'Spaces')).toContainText('8 available')
    await expect(page.getByRole('link', { name: 'View all 8' })).toBeVisible()
  })
})
