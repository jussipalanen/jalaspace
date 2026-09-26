import { expect, test, type APIRequestContext } from '@playwright/test'
import { E2E_BACKEND_URL, expectPageHeading, signedInState } from './fixtures'

// Runs with playwright.api.config.ts: the app uses VITE_DATA_PROVIDER=api
// and the real API. The API data is shared, so every test starts by resetting it.

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

const api = (path: string) => `${E2E_BACKEND_URL}/api${path}`

async function getJson<T>(request: APIRequestContext, path: string): Promise<T> {
  const response = await request.get(api(path))
  expect(response.ok(), `GET ${path}`).toBe(true)
  return (await response.json()) as T
}

const entityKeys = () =>
  Object.keys(localStorage).filter((key) => /properties|units|tenants|leases|maintenance|seed_version/.test(key))

test.beforeEach(async ({ request }) => {
  expect((await request.post(api('/demo/reset'))).status()).toBe(204)
})

test.describe('api data provider', () => {
  test('shows the API data and keeps none of it in the browser', async ({ page, request }) => {
    await page.goto('/')
    const figures = page.getByRole('region', { name: 'Key figures' })
    await expect(figures).toContainText('58 of 68 spaces occupied')

    // A change made directly on the API shows up in the app.
    const property = await getJson<Record<string, unknown>>(request, '/properties/property-joensuu-center')
    await request.put(api('/properties/property-joensuu-center'), { data: { ...property, name: 'Joensuu Centre' } })
    await page.goto('/properties')
    await expect(page.getByRole('link', { name: 'Joensuu Centre' })).toBeVisible()

    expect(await page.evaluate(entityKeys)).toEqual([])
  })

  test('shows the app at once and explains the wait while the API wakes up', async ({ page }) => {
    // Answer every API request 6 seconds late, like a sleeping free-plan server.
    await page.route(`${E2E_BACKEND_URL}/api/**`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 6000))
      await route.continue()
    })
    await page.goto('/')

    // The page is not blank while it waits: the app renders its loading state.
    const status = page.getByRole('status').filter({ hasText: 'Loading dashboard…' })
    await expect(status).toBeVisible({ timeout: 2000 })
    await expect(status).toContainText('Waking up the demo server.')
    await expect(page.getByRole('region', { name: 'Key figures' })).toContainText('58 of 68 spaces occupied', {
      timeout: 15_000,
    })
  })

  test('saves a new property on the API, visible after a reload and in another browser', async ({
    page,
    browser,
    baseURL,
    request,
  }) => {
    await page.goto('/properties/new')
    await page.getByLabel('Name').fill('Oulu Office House')
    await page.getByLabel('Type').selectOption('Office')
    await page.getByLabel('Street address').fill('Kauppurienkatu 3')
    await page.getByLabel('Postal code').fill('90100')
    await page.getByLabel('City').fill('Oulu')
    await page.getByRole('button', { name: 'Save property' }).click()
    await expectPageHeading(page, 'Oulu Office House')

    // The API assigned the id the app navigated to.
    const properties = await getJson<{ id: string; name: string }[]>(request, '/properties')
    const created = properties.find(({ name }) => name === 'Oulu Office House')
    expect(created?.id).toMatch(/^[0-9a-f-]{36}$/)
    await expect(page).toHaveURL(`/properties/${created!.id}`)

    await page.reload()
    await expectPageHeading(page, 'Oulu Office House')

    const other = await browser.newContext({ storageState: signedInState(baseURL!) })
    const otherPage = await other.newPage()
    await otherPage.goto('/properties')
    await expect(otherPage.getByRole('link', { name: 'Oulu Office House' })).toBeVisible()
    await other.close()
  })

  test('completes a maintenance task', async ({ page, request }) => {
    await page.goto('/maintenance/maintenance-3')
    await expectPageHeading(page, 'Main entrance door closer broken')
    const status = page.getByRole('region', { name: 'Status' })
    await status.getByRole('button', { name: 'Mark as completed' }).click()
    await expect(status).toContainText('Completed')

    const task = await getJson<{ status: string; completedAt: string | null }>(request, '/maintenance/maintenance-3')
    expect(task.status).toBe('completed')
    expect(task.completedAt).not.toBeNull()
  })

  test('occupies a space with a new lease and rejects an overlapping one', async ({ page, request }) => {
    const spaceStatus = async () =>
      (await getJson<{ status: string }>(request, '/units/space-kuopio-harbour-10')).status
    expect(await spaceStatus()).toBe('available')

    await page.goto('/leases/new?space=space-kuopio-harbour-10')
    await page.getByRole('combobox', { name: 'Tenant' }).selectOption({ label: 'Mikko Esimerkki' })
    await page.getByLabel('Monthly rent (€)').fill('980')
    await page.getByRole('button', { name: 'Save lease' }).click()
    await expect(page.getByText('The lease of B 204 for Mikko Esimerkki was created.')).toBeVisible()
    expect(await spaceStatus()).toBe('occupied')

    await page.goto('/leases/new?space=space-kuopio-harbour-10')
    await page.getByRole('combobox', { name: 'Tenant' }).selectOption({ label: 'Aino Esimerkki' })
    await page.getByRole('button', { name: 'Save lease' }).click()
    await expect(
      page.getByText('This space already has a lease during this period. Change the dates or choose another space.'),
    ).toBeVisible()
  })

  test('Reset demo data in Settings restores the API data', async ({ page, request }) => {
    expect((await request.delete(api('/maintenance/maintenance-1'))).status()).toBe(204)

    await page.goto('/settings')
    await expect(
      page.getByText('JalaSpace stores the demo data on the API server, shared by everyone who uses it.'),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Reset demo data' }).click()
    const dialog = page.getByRole('dialog', { name: 'Reset demo data?' })
    await expect(dialog).toContainText('The demo data is reset for everyone who uses this API')
    await dialog.getByRole('button', { name: 'Reset demo data' }).click()
    await expect(page.getByText('The demo data was reset.')).toBeVisible()

    expect(await getJson<unknown[]>(request, '/maintenance')).toHaveLength(14)
  })
})
