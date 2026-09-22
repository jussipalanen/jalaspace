import { expect, test, type Page, type Route } from '@playwright/test'
import { API_URL, expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

const TITLE = 'kitchen sink leak'
const SUGGESTED_DESCRIPTION = [
  'Water is leaking at the kitchen sink.',
  '',
  'To check:',
  '- the drain trap and connections under the sink',
  '- the supply hoses and shut-off valves',
].join('\n')

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
  test('suggests a description from the title, applies it and saves the task', async ({ page }) => {
    await mockFeatures(page, true)
    const requests = await mockSuggestions(page, 200, {
      title: 'Kitchen sink water leak',
      description: SUGGESTED_DESCRIPTION,
      category: 'plumbing',
      priority: 'high',
    })

    await page.goto('/maintenance/new')
    await expectPageHeading(page, 'Add maintenance task')
    const suggest = page.getByRole('button', { name: 'Suggest with AI' })
    await expect(suggest).toBeDisabled()
    await expect(page.getByText(/sent to Google Gemini/)).toBeVisible()

    await page.getByLabel('Title').fill(TITLE)
    await suggest.click()

    const card = page.getByRole('region', { name: 'AI suggestion' })
    await expect(card).toContainText('Kitchen sink water leak')
    await expect(card).toContainText('To check:')
    await expect(card).toContainText('- the supply hoses and shut-off valves')
    await expect(card).toContainText('Plumbing')
    await expect(card).toContainText('High')
    expect(requests).toEqual([{ title: TITLE, description: '', language: 'en' }])

    await card.getByRole('button', { name: 'Apply suggestion' }).click()
    await expect(card).toBeHidden()
    await expect(page.getByLabel('Title')).toHaveValue('Kitchen sink water leak')
    await expect(page.getByLabel('Title')).toBeFocused()
    await expect(page.getByLabel('Description')).toHaveValue(SUGGESTED_DESCRIPTION)
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
    await page.getByLabel('Description').fill('water leaking under kitchen sink')
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
    await page.getByLabel('Description').fill('water leaking under kitchen sink')
    await expect(page.getByRole('button', { name: 'Suggest with AI' })).toHaveCount(0)
  })
})
