import { expect, test, type Page, type Route } from '@playwright/test'
import { API_URL, expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

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

/** Mocks `GET /api/features` and `POST /api/ask`; tests never reach a real API or Gemini. */
async function mockAsk(page: Page, answers: unknown[]) {
  const questions: unknown[] = []
  await page.route(`${API_URL}/api/features`, (route) =>
    fulfillJson(route, 200, { maintenanceSuggestions: false, ask: true }),
  )
  await page.route(`${API_URL}/api/ask`, (route) => {
    if (route.request().method() === 'OPTIONS') return fulfillJson(route, 204, null)
    questions.push(route.request().postDataJSON())
    return fulfillJson(route, 200, answers.shift())
  })
  return questions
}

test.describe('Ask JalaSpace', () => {
  test('finds an available three-room apartment with a sauna and opens it', async ({ page }) => {
    const questions = await mockAsk(page, [
      {
        kind: 'search',
        area: 'spaces',
        filter: { types: ['apartment'], statuses: ['available'], rooms: { min: 3, max: 3 }, features: ['sauna'] },
        ignored: [],
      },
    ])
    await page.goto('/')

    const card = page.getByRole('region', { name: 'Ask JalaSpace' })
    await card.getByLabel('Your question').fill('available three-room apartment with a sauna')
    await card.getByRole('button', { name: 'Ask' }).click()

    await expect(card.getByRole('status')).toHaveText('1 space found')
    expect(questions).toEqual([
      { question: 'available three-room apartment with a sauna', today: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) },
    ])
    await expect(card.getByText('Features: Sauna')).toBeVisible()
    await card.getByRole('link', { name: 'A 11' }).click()

    await expectPageHeading(page, 'Edit space')
    await expect(page.getByLabel('Rooms')).toHaveValue('3')
    await expect(page.getByRole('checkbox', { name: 'Sauna' })).toBeChecked()
  })

  test('takes the user to the right Settings section', async ({ page }) => {
    await mockAsk(page, [{ kind: 'navigate', place: 'settings.demoData' }])
    await page.goto('/')

    const card = page.getByRole('region', { name: 'Ask JalaSpace' })
    await card.getByLabel('Your question').fill('where can I reset the demo data?')
    await card.getByRole('button', { name: 'Ask' }).click()
    await card.getByRole('link', { name: 'Settings › Demo data' }).click()

    await expect(page).toHaveURL('/settings#demo-data')
    await expect(page.getByRole('button', { name: 'Reset demo data' })).toBeInViewport()
  })
})
