import { expect, test, type Page, type Route } from '@playwright/test'
import { API_URL, expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

const DESCRIPTION = 'Water is leaking under the kitchen sink. It started this morning.'

/** Answers a request to the placeholder API, including the CORS headers a real API sends. */
function fulfillJson(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'GET, POST',
    },
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

/** Mocks `GET /api/features`; tests never reach a real API or Gemini. */
async function mockFeatures(page: Page, maintenanceSuggestions: boolean) {
  await page.route(`${API_URL}/api/features`, (route) =>
    fulfillJson(route, 200, { maintenanceSuggestions }),
  )
}

/** Mocks `POST /api/maintenance/suggestions` and records the request bodies. */
async function mockSuggestions(page: Page, status: number, body: unknown) {
  const requests: unknown[] = []
  await page.route(`${API_URL}/api/maintenance/suggestions`, (route) => {
    if (route.request().method() === 'OPTIONS') return fulfillJson(route, 204, null)
    requests.push(route.request().postDataJSON())
    return fulfillJson(route, status, body)
  })
  return requests
}

test.describe('maintenance AI suggestions', () => {
  test('applies a suggestion to the form and saves the task', async ({ page }) => {
    await mockFeatures(page, true)
    const requests = await mockSuggestions(page, 200, {
      title: 'Kitchen sink water leak',
      category: 'plumbing',
      priority: 'high',
    })

    await page.goto('/maintenance/new')
    await expectPageHeading(page, 'Add maintenance task')
    const suggest = page.getByRole('button', { name: 'Suggest with AI' })
    await expect(suggest).toBeDisabled()
    await expect(page.getByText(/sent to Google Gemini/)).toBeVisible()

    await page.getByLabel('Description').fill(DESCRIPTION)
    await suggest.click()

    const card = page.getByRole('region', { name: 'AI suggestion' })
    await expect(card).toContainText('Kitchen sink water leak')
    await expect(card).toContainText('Plumbing')
    await expect(card).toContainText('High')
    expect(requests).toEqual([{ description: DESCRIPTION, language: 'en' }])

    await card.getByRole('button', { name: 'Apply suggestion' }).click()
    await expect(card).toBeHidden()
    await expect(page.getByLabel('Title')).toHaveValue('Kitchen sink water leak')
    await expect(page.getByLabel('Title')).toBeFocused()
    await expect(page.getByLabel('Category')).toHaveValue('plumbing')
    await expect(page.getByLabel('Priority')).toHaveValue('high')

    await page.getByLabel('Property').selectOption({ label: 'Joensuu Center' })
    await page.getByRole('button', { name: 'Save task' }).click()
    await expect(page.getByText('Task Kitchen sink water leak was added.')).toBeVisible()
    await expectPageHeading(page, 'Kitchen sink water leak')
  })

  test('shows a translated error and keeps the form usable', async ({ page }) => {
    await mockFeatures(page, true)
    await mockSuggestions(page, 429, { error: { code: 'rate_limited' } })

    await page.goto('/maintenance/new')
    await page.getByLabel('Description').fill(DESCRIPTION)
    await page.getByRole('button', { name: 'Suggest with AI' }).click()
    await expect(page.getByText('Too many suggestions in a short time.', { exact: false })).toBeVisible()

    await page.getByRole('combobox', { name: 'Language' }).selectOption('Suomi')
    await page.getByRole('button', { name: 'Ehdota tekoälyllä' }).click()
    await expect(page.getByText('Liian monta ehdotusta', { exact: false })).toBeVisible()
    await expect(page.getByLabel('Otsikko')).toBeEditable()
  })

  test('is not offered when the API has no AI provider', async ({ page }) => {
    await mockFeatures(page, false)
    // The button is also hidden while the API is being asked, so wait for the answer.
    const featuresChecked = page.waitForResponse(`${API_URL}/api/features`)

    await page.goto('/maintenance/new')
    await featuresChecked
    await page.getByLabel('Description').fill(DESCRIPTION)
    await expect(page.getByRole('button', { name: 'Suggest with AI' })).toHaveCount(0)
  })
})
