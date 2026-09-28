import { expect, test, type Page } from '@playwright/test'
import { expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

const occupancy = (page: Page) => figure(page, 'Occupancy')
const figure = (page: Page, label: string) =>
  page.getByRole('region', { name: 'Key figures' }).getByRole('link', { name: new RegExp(`^${label}`) })

test.describe('dashboard', () => {
  test('draws the figures as rings that grow once, and not at all with reduced motion', async ({ page }) => {
    await page.goto('/')
    const segments = page.getByRole('region', { name: 'Key figures' }).locator('.ring-chart__segment')
    // Spaces 4, occupancy 1, maintenance 3, applications 2: one arc per non-empty segment.
    await expect(segments).toHaveCount(10)
    expect(await segments.first().evaluate((arc) => getComputedStyle(arc).animationName)).toBe('ring-chart-grow')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await expect(segments).toHaveCount(10)
    expect(await segments.first().evaluate((arc) => getComputedStyle(arc).animationName)).toBe('none')
  })

  test('shows the JalaSpace logo from the build', async ({ page }) => {
    await page.goto('/')
    await expectPageHeading(page, 'Dashboard')

    // The decorative logo has no accessible name, so it is found by its class.
    const logo = page.locator('img.dashboard__logo')
    await expect(logo).toBeVisible()
    expect(await logo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
    expect((await logo.boundingBox())!.height).toBe(40)
  })

  test('shows figures and lists from the seeded demo data', async ({ page }) => {
    await page.goto('/')

    await expect(figure(page, 'Properties')).toContainText('4')
    await expect(figure(page, 'Spaces')).toContainText('Available 6')
    await expect(figure(page, 'Spaces')).toContainText('Reserved 1')
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
    await expect(figure(page, 'Spaces')).toContainText('Available 6')
    await expect(figure(page, 'Spaces')).toContainText('Reserved 1')

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
    await expect(figure(page, 'Spaces')).toContainText('Available 7')
    await expect(page.getByRole('link', { name: 'View all 8' })).toBeVisible()
  })

  test('an application sent through the public form shows up first', async ({ page }) => {
    await page.goto('/')
    await expect(figure(page, 'Open applications')).toContainText('5')

    await page.goto('/apply/space-kuopio-harbour-3')
    const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await page.getByRole('textbox', { name: /^Full name/ }).fill('Liisa Esimerkki')
    await page.getByRole('textbox', { name: /^Email/ }).fill('liisa.esimerkki@example.com')
    await page
      .getByRole('textbox', { name: /^Desired start date/ })
      .fill(`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`)
    await page.getByRole('checkbox', { name: /I understand this is a demo/ }).check()
    await page.getByRole('button', { name: 'Send application' }).click()
    await expectPageHeading(page, 'Application sent')

    await page.goto('/')
    await expect(figure(page, 'Open applications')).toContainText('New 4')
    const latest = page.getByRole('region', { name: 'Latest applications' })
    await expect(latest.getByRole('listitem').first()).toContainText('Liisa Esimerkki')
    await expect(page.getByRole('region', { name: 'Recent activity' })).toContainText(
      'Application received: Liisa Esimerkki, B 103',
    )
  })
})
