import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocalStorageDemoDataStore } from '../../repositories/localStorage/LocalStorageDemoDataStore'
import { initializeDemoData } from '../../services/demoDataService'
import { renderRoute } from '../../test/renderRoute'
import { resetSuggestionsAvailability } from './useSuggestionsAvailable'

const API_URL = 'http://api.test'
const suggestion = { title: 'Kitchen sink leak', category: 'plumbing', priority: 'high' }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/** A fake API: `/api/features` and `/api/maintenance/suggestions`. */
function fakeApi({
  available = true,
  suggest = async () => json(suggestion),
}: {
  available?: boolean
  suggest?: (init: RequestInit) => Promise<Response>
} = {}) {
  const fetch = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input)
    if (url === `${API_URL}/api/features`) return json({ maintenanceSuggestions: available })
    if (url === `${API_URL}/api/maintenance/suggestions`) return suggest(init)
    return json({ error: { code: 'not_found' } }, 404)
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

const describeProblem = async (user: ReturnType<typeof userEvent.setup>, text: string) =>
  user.type(await screen.findByLabelText(/^Description/), text)

describe('AI maintenance suggestions', () => {
  beforeEach(async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
    resetSuggestionsAvailability()
    vi.stubEnv('VITE_API_URL', API_URL)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('is not offered when no API is configured', async () => {
    vi.stubEnv('VITE_API_URL', '')
    const fetch = fakeApi()
    renderRoute('/maintenance/new')

    expect(await screen.findByLabelText(/^Description/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Suggest with AI' })).not.toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('is not offered when the API has no AI provider', async () => {
    const fetch = fakeApi({ available: false })
    renderRoute('/maintenance/new')

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(`${API_URL}/api/features`, expect.anything()))
    expect(screen.queryByRole('button', { name: 'Suggest with AI' })).not.toBeInTheDocument()
  })

  it('shows the suggestion and fills the form only when applied', async () => {
    const user = userEvent.setup()
    const fetch = fakeApi()
    renderRoute('/maintenance/new?property=property-joensuu-center')

    const button = await screen.findByRole('button', { name: 'Suggest with AI' })
    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription(/sent to Google Gemini/)
    await describeProblem(user, 'Water is leaking under the kitchen sink.')
    await user.click(button)

    const card = await screen.findByRole('region', { name: 'AI suggestion' })
    expect(within(card).getByText('Kitchen sink leak')).toBeInTheDocument()
    expect(within(card).getByText('Plumbing')).toBeInTheDocument()
    expect(within(card).getByText('High')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Title/)).toHaveValue('')

    const [, init] = fetch.mock.calls.find(([url]) => String(url).endsWith('/suggestions'))!
    expect(JSON.parse(String(init?.body))).toEqual({
      description: 'Water is leaking under the kitchen sink.',
      language: 'en',
    })

    await user.click(within(card).getByRole('button', { name: 'Apply suggestion' }))

    expect(screen.getByLabelText(/^Title/)).toHaveValue('Kitchen sink leak')
    expect(screen.getByLabelText(/^Title/)).toHaveFocus()
    expect(screen.getByLabelText(/^Category/)).toHaveValue('plumbing')
    expect(screen.getByLabelText(/^Priority/)).toHaveValue('high')
    expect(screen.queryByRole('region', { name: 'AI suggestion' })).not.toBeInTheDocument()
  })

  it('leaves the form unchanged when the suggestion is dismissed', async () => {
    const user = userEvent.setup()
    fakeApi()
    renderRoute('/maintenance/new')

    await describeProblem(user, 'Leak')
    await user.type(screen.getByLabelText(/^Title/), 'My own title')
    await user.click(await screen.findByRole('button', { name: 'Suggest with AI' }))
    const card = await screen.findByRole('region', { name: 'AI suggestion' })
    await user.click(within(card).getByRole('button', { name: 'Dismiss' }))

    expect(screen.queryByRole('region', { name: 'AI suggestion' })).not.toBeInTheDocument()
    expect(screen.getByLabelText(/^Title/)).toHaveValue('My own title')
    expect(screen.getByLabelText(/^Priority/)).toHaveValue('medium')
  })

  it('asks for the title in the UI language', async () => {
    const user = userEvent.setup()
    const fetch = fakeApi({ suggest: async () => json({ ...suggestion, title: 'Keittiön vesivuoto' }) })
    renderRoute('/maintenance/new', { language: 'fi' })

    await user.type(await screen.findByLabelText(/^Kuvaus/), 'Vettä vuotaa tiskipöydän alla.')
    await user.click(await screen.findByRole('button', { name: 'Ehdota tekoälyllä' }))

    expect(await screen.findByText('Keittiön vesivuoto')).toBeInTheDocument()
    const [, init] = fetch.mock.calls.find(([url]) => String(url).endsWith('/suggestions'))!
    expect(JSON.parse(String(init?.body)).language).toBe('fi')
  })

  it.each([
    [
      'the rate limit',
      async () => json({ error: { code: 'rate_limited' } }, 429),
      'Too many suggestions in a short time. Please wait a few minutes and try again.',
    ],
    [
      'an unavailable AI',
      async () => json({ error: { code: 'ai_unavailable' } }, 503),
      'AI suggestions are not available right now. Please try again later.',
    ],
    [
      'an unusable answer',
      async () => json({ ...suggestion, category: 'water' }),
      'AI could not suggest anything useful. Try describing the problem in more detail.',
    ],
    [
      'an unreachable API',
      () => Promise.reject(new TypeError('Failed to fetch')),
      'Unable to reach the JalaSpace API. Please try again.',
    ],
  ])('explains %s and keeps the form usable', async (_case, suggest, message) => {
    const user = userEvent.setup()
    fakeApi({ suggest })
    renderRoute('/maintenance/new')

    await describeProblem(user, 'Leak')
    await user.click(await screen.findByRole('button', { name: 'Suggest with AI' }))

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Suggest with AI' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Save task' })).toBeEnabled()
  })
})
