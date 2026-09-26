import { expect, test, type Page } from '@playwright/test'
import { expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

/** A grey 1×1 PNG, served instead of OpenStreetMap's map tiles. */
const TILE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64',
)

const OULU_MATCH = {
  lat: '65.0120890',
  lon: '25.4650770',
  display_name: '3, Kauppurienkatu, Keskusta, Oulu, 90100, Suomi / Finland',
}

/** Answers the map tile and address search requests; returns the searches made. */
async function mockOpenStreetMap(page: Page): Promise<URL[]> {
  const searches: URL[] = []
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: TILE }),
  )
  await page.route('https://nominatim.openstreetmap.org/search?*', (route) => {
    searches.push(new URL(route.request().url()))
    return route.fulfill({ json: [OULU_MATCH] })
  })
  return searches
}

async function createProperty(page: Page, name: string) {
  await page.goto('/properties/new')
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Type').selectOption('Office')
  await page.getByLabel('Street address').fill('Kauppurienkatu 3')
  await page.getByLabel('Postal code').fill('90100')
  await page.getByLabel('City').fill('Oulu')
  await page.getByRole('button', { name: 'Save property' }).click()
  await expectPageHeading(page, name)
}

test.describe('properties', () => {
  test('a created property appears in the list and survives a reload', async ({ page }) => {
    await createProperty(page, 'Oulu Tech Campus')
    await expect(page.getByText('Property Oulu Tech Campus was added.')).toBeVisible()

    await page.getByRole('link', { name: 'Properties' }).first().click()
    await expect(page.getByRole('link', { name: 'Oulu Tech Campus' })).toBeVisible()
    await expect(page.getByText('5 properties')).toBeVisible()

    await page.reload()
    await expect(page.getByRole('link', { name: 'Oulu Tech Campus' })).toBeVisible()
    // The one-time success message is not shown again.
    await expect(page.getByText('Property Oulu Tech Campus was added.')).toHaveCount(0)
  })

  test('the location is set by searching the address and dragging the pin, and survives a reload', async ({
    page,
  }) => {
    const searches = await mockOpenStreetMap(page)
    await page.goto('/properties/new')
    await page.getByLabel('Name').fill('Oulu Tech Campus')
    await page.getByLabel('Street address').fill('Kauppurienkatu 3')
    await page.getByLabel('Postal code').fill('90100')
    await page.getByLabel('City').fill('Oulu')

    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await page.getByRole('list', { name: 'Matches' }).getByRole('button', { name: OULU_MATCH.display_name }).click()
    expect(searches).toHaveLength(1)
    expect(searches[0]!.searchParams.get('q')).toBe('Kauppurienkatu 3, 90100 Oulu')
    expect(searches[0]!.searchParams.get('countrycodes')).toBe('fi')
    await expect(page.getByLabel('Latitude')).toHaveValue('65.012089')
    await expect(page.getByLabel('Longitude')).toHaveValue('25.465077')

    // Fine-tune by dragging the pin to the south-east.
    const pin = page.getByRole('region', { name: 'Map for setting the location' }).getByTitle('Property location. Drag to move.')
    const box = (await pin.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 40, { steps: 10 })
    await page.mouse.up()
    await expect(page.getByLabel('Latitude')).not.toHaveValue('65.012089')
    const latitude = Number(await page.getByLabel('Latitude').inputValue())
    const longitude = Number(await page.getByLabel('Longitude').inputValue())
    expect(latitude).toBeLessThan(65.012089)
    expect(longitude).toBeGreaterThan(25.465077)

    await page.getByRole('button', { name: 'Save property' }).click()
    await expectPageHeading(page, 'Oulu Tech Campus')
    const coordinates = page.getByText(`${latitude}, ${longitude}`)
    await expect(page.getByRole('region', { name: 'Map of Oulu Tech Campus' })).toBeVisible()
    await expect(coordinates).toBeVisible()

    await page.reload()
    await expect(coordinates).toBeVisible()
  })

  test('an invalid property cannot be saved', async ({ page }) => {
    await page.goto('/properties/new')
    await page.getByLabel('Postal code').fill('abc')
    await page.getByRole('button', { name: 'Save property' }).click()

    await expect(page.getByText('Please correct the highlighted fields.')).toBeVisible()
    await expect(page.getByLabel('Name')).toBeFocused()
    await expect(page.getByText('Enter a 5-digit postal code.')).toBeVisible()
    await expect(page).toHaveURL('/properties/new')
  })

  test('searches properties and keeps the search after a reload', async ({ page }) => {
    await page.goto('/properties')
    await page.getByRole('searchbox', { name: 'Search properties' }).fill('70100')

    await expect(page).toHaveURL('/properties?q=70100')
    await expect(page.getByRole('link', { name: 'Kuopio Harbour Business Park' })).toBeVisible()
    await expect(page.getByText('1 property')).toBeVisible()

    await page.reload()
    await expect(page.getByRole('searchbox', { name: 'Search properties' })).toHaveValue('70100')
    await expect(page.getByText('1 property')).toBeVisible()
  })

  test('edits a property from its details page', async ({ page }) => {
    await page.goto('/properties/property-tampere-hervanta')
    await page.getByRole('link', { name: 'Edit', exact: true }).click()
    await page.getByLabel('Name').fill('Tampere Hervanta Logistics Park')
    await page.getByRole('button', { name: 'Save property' }).click()

    await expectPageHeading(page, 'Tampere Hervanta Logistics Park')
    await expect(page.getByText('Changes to Tampere Hervanta Logistics Park were saved.')).toBeVisible()
  })

  test('explains why a property with spaces cannot be deleted', async ({ page }) => {
    await page.goto('/properties/property-helsinki-kallio')
    await page.getByRole('button', { name: 'Delete' }).click()

    const dialog = page.getByRole('dialog', { name: 'Helsinki Kallio Residences cannot be deleted' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('16 spaces')
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('deletes a property after confirmation', async ({ page }) => {
    await createProperty(page, 'Temporary Site')
    await page.getByRole('button', { name: 'Delete' }).click()

    const dialog = page.getByRole('dialog', { name: 'Delete Temporary Site?' })
    await dialog.getByRole('button', { name: 'Delete property' }).click()

    await expectPageHeading(page, 'Properties')
    await expect(page.getByText('Property Temporary Site was deleted.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Temporary Site' })).toHaveCount(0)
  })
})
