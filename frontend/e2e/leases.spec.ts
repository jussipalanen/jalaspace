import { expect, test, type Page } from '@playwright/test'
import { expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

const count = (page: Page) => page.locator('.list-toolbar__count')
const occupancy = (page: Page) =>
  page.getByRole('region', { name: 'Key figures' }).getByRole('link', { name: /^Occupancy/ })

/** A date `offset` days from today as d.m.yyyy, computed in the browser. */
const day = (page: Page, offset: number) =>
  page.evaluate((days) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
  }, offset)

test.describe('leases', () => {
  test('filters survive a reload and a direct link', async ({ page }) => {
    await page.goto('/leases')
    await expect(count(page)).toHaveText('62 leases')

    await page.getByLabel('Status').selectOption({ label: 'Ended' })
    await expect(count(page)).toHaveText('3 leases')
    await page.reload()
    await expect(count(page)).toHaveText('3 leases')

    await page.goto('/leases?status=upcoming')
    await expect(count(page)).toHaveText('1 lease')
    await expect(page.getByRole('link', { name: 'Aurora Yoga Studio Oy', exact: true })).toBeVisible()
  })

  test('creates a lease, schedules its end and keeps the space status in step', async ({ page }) => {
    await page.goto('/')
    await expect(occupancy(page)).toContainText('85%')

    await page.goto('/leases')
    await page.getByRole('link', { name: 'New lease' }).click()
    await expectPageHeading(page, 'New lease')
    await page.getByRole('combobox', { name: 'Tenant' }).selectOption({ label: 'Mikko Esimerkki' })
    await page.getByRole('combobox', { name: 'Property' }).selectOption({ label: 'Kuopio Harbour Business Park' })
    await page.getByRole('combobox', { name: 'Space' }).selectOption({ label: 'B 204 (Available)' })
    await page.getByLabel('Monthly rent (€)').fill('980')
    await expect(page.getByText('The lease is active today, so the space will be occupied.')).toBeVisible()
    await page.getByRole('button', { name: 'Save lease' }).click()
    await expect(page.getByText('The lease of B 204 for Mikko Esimerkki was created.')).toBeVisible()

    await page.reload()
    await page.getByRole('searchbox', { name: 'Search leases' }).fill('B 204')
    // Wait for the filter: Mikko Esimerkki also has another lease.
    await expect(count(page)).toHaveText('1 lease')
    const row = page.getByRole('row').filter({ hasText: 'Mikko Esimerkki' })
    await expect(row).toContainText('Active')
    await expect(row).toContainText('€980.00')
    await page.goto('/')
    await expect(occupancy(page)).toContainText('87%')

    // Schedule the move-out: the lease stays active until the end date.
    await page.goto('/units/space-kuopio-harbour-10/edit')
    await page.getByRole('link', { name: 'View lease' }).click()
    await expectPageHeading(page, 'Edit lease')
    const end = await day(page, 30)
    await page.getByRole('textbox', { name: 'End date' }).fill(end)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Save lease' }).click()
    await expect(page.getByText('Changes to the lease of B 204 were saved.')).toBeVisible()
    await expect(page).toHaveURL('/units/space-kuopio-harbour-10/edit')
    await expect(page.getByText(/^Occupied under an active lease since /)).toBeVisible()

    // A 1's lease started months ago; ending it yesterday frees the space.
    await page.goto('/units/space-helsinki-kallio-1/edit')
    await page.getByRole('link', { name: 'View lease' }).click()
    await page.getByRole('textbox', { name: 'End date' }).fill(await day(page, -1))
    await page.keyboard.press('Escape')
    await expect(page.getByText('The lease period has ended, so it does not occupy the space.')).toBeVisible()
    await page.getByRole('button', { name: 'Save lease' }).click()
    await expect(page.getByRole('combobox', { name: 'Status' })).toHaveValue('available')
    await expect(page).toHaveURL('/units/space-helsinki-kallio-1/edit')
    await page.goto('/')
    await expect(occupancy(page)).toContainText('85%')
  })

  test('rejects an overlapping lease', async ({ page }) => {
    await page.goto('/leases/new?space=space-joensuu-center-6')
    await page.getByRole('combobox', { name: 'Tenant' }).selectOption({ label: 'Mikko Esimerkki' })
    await page.getByRole('button', { name: 'Save lease' }).click()
    await expect(
      page.getByText('This space already has a lease during this period. Change the dates or choose another space.'),
    ).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Space' })).toBeFocused()
  })

  test('updates space statuses on app start after lease dates have passed', async ({ page }) => {
    await page.goto('/units?property=property-helsinki-kallio')
    const a1 = page.getByRole('row').filter({ has: page.getByRole('link', { name: 'Edit A 1', exact: true }) })
    await expect(a1).toContainText('Occupied')

    // Simulate time passing: A 1's lease ended yesterday, without the app noticing.
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

    await expect(a1).toContainText('Available')
    await page.goto('/')
    await expect(occupancy(page)).toContainText('84%')
  })
})
