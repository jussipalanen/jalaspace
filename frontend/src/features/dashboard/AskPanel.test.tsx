import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetApiFeatures } from '../../hooks/useApiFeature'
import { LocalStorageDemoDataStore } from '../../repositories/localStorage/LocalStorageDemoDataStore'
import { initializeDemoData } from '../../services/demoDataService'
import { renderRoute } from '../../test/renderRoute'
import { toIsoDate } from '../../utils/date'

const API_URL = 'http://api.test'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const saunaApartments = {
  kind: 'search',
  area: 'spaces',
  filter: { types: ['apartment'], rooms: { min: 3, max: 3 }, features: ['sauna'] },
  ignored: ['cheap'],
}

/** A fake API: `/api/features` and `/api/ask`. */
function fakeApi({ ask = true, answer = async () => json(saunaApartments) }: {
  ask?: boolean
  answer?: (init: RequestInit) => Promise<Response>
} = {}) {
  const fetch = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input)
    if (url === `${API_URL}/api/features`) return json({ maintenanceSuggestions: false, ask })
    if (url === `${API_URL}/api/ask`) return answer(init)
    return json({ error: { code: 'not_found' } }, 404)
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

async function askQuestion(user: ReturnType<typeof userEvent.setup>, question: string) {
  await user.type(await screen.findByLabelText('Your question'), question)
  await user.click(screen.getByRole('button', { name: 'Ask' }))
}

const card = () => screen.getByRole('region', { name: 'Ask JalaSpace' })
const results = () => within(card()).getAllByRole('listitem').filter((item) => item.querySelector('a.dashboard-list__title'))

describe('Ask JalaSpace', () => {
  beforeEach(async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
    resetApiFeatures()
    vi.stubEnv('VITE_API_URL', API_URL)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('is not offered without an API or when the API has no AI provider', async () => {
    vi.stubEnv('VITE_API_URL', '')
    fakeApi()
    const { unmount } = renderRoute('/')
    expect(await screen.findByRole('heading', { name: 'Recent maintenance' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Ask JalaSpace' })).not.toBeInTheDocument()
    unmount()

    vi.stubEnv('VITE_API_URL', API_URL)
    const fetch = fakeApi({ ask: false })
    renderRoute('/')
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(`${API_URL}/api/features`, expect.anything()))
    expect(screen.queryByRole('region', { name: 'Ask JalaSpace' })).not.toBeInTheDocument()
  })

  it("sends the question with today's date, waits, and lists the matching spaces", async () => {
    const user = userEvent.setup()
    let respond: (response: Response) => void = () => {}
    const fetch = fakeApi({ answer: () => new Promise((resolve) => (respond = resolve)) })
    renderRoute('/')

    expect(await screen.findByText(/sent to Google Gemini/)).toBeInTheDocument()
    await askQuestion(user, 'cheap three-room apartment with a sauna')

    expect(within(card()).getByRole('status')).toHaveTextContent('Waiting for response…')
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled()
    const [, init] = fetch.mock.calls.find(([url]) => String(url).endsWith('/api/ask'))!
    expect(JSON.parse(String(init?.body))).toEqual({
      question: 'cheap three-room apartment with a sauna',
      today: toIsoDate(new Date()),
    })

    respond(json(saunaApartments))

    expect(await within(card()).findByText('6 spaces found')).toBeInTheDocument()
    expect(within(card()).getByText('Type: Apartment')).toBeInTheDocument()
    expect(within(card()).getByText('Rooms: 3')).toBeInTheDocument()
    expect(within(card()).getByText('Features: Sauna')).toBeInTheDocument()
    expect(within(card()).getByText('Not used: cheap')).toBeInTheDocument()
    expect(results().map((item) => within(item).getByRole('link').textContent)).toEqual([
      'A 4',
      'A 8',
      'A 11',
      'A 12',
      'A 15',
    ])
    expect(within(card()).getByRole('link', { name: 'A 11' })).toHaveAttribute(
      'href',
      '/units/space-helsinki-kallio-11/edit',
    )

    await user.click(within(card()).getByRole('button', { name: 'Show all 6' }))
    expect(results()).toHaveLength(6)
    // The Spaces page cannot filter by type, so there is no link to it.
    expect(within(card()).queryByRole('link', { name: 'Open in Spaces' })).not.toBeInTheDocument()
  })

  it('searches again when a condition is removed, and links to the list page when it can', async () => {
    const user = userEvent.setup()
    fakeApi()
    renderRoute('/')

    await askQuestion(user, 'three-room apartment with a sauna')
    await within(card()).findByText('6 spaces found')

    await user.click(within(card()).getByRole('button', { name: 'Remove condition: Type: Apartment' }))
    expect(within(card()).getByText('6 spaces found')).toBeInTheDocument()
    expect(within(card()).getByRole('link', { name: 'Open in Spaces' })).toHaveAttribute(
      'href',
      '/units?rooms=3&features=sauna',
    )

    await user.click(within(card()).getByRole('button', { name: 'Remove condition: Rooms: 3' }))
    expect(within(card()).getByText('7 spaces found')).toBeInTheDocument()
  })

  it('links to the place in the app, and opens the Settings section', async () => {
    const user = userEvent.setup()
    fakeApi({ answer: async () => json({ kind: 'navigate', place: 'settings.language' }) })
    const { router } = renderRoute('/')

    await askQuestion(user, 'where can I change the language?')
    const link = await within(card()).findByRole('link', { name: 'Settings › Language' })
    expect(within(card()).getByRole('status')).toHaveTextContent('You can find it here: Settings › Language')

    await user.click(link)
    expect(router.state.location.pathname).toBe('/settings')
    expect(router.state.location.hash).toBe('#language')
  })

  it('opens the API documentation in a new tab', async () => {
    const user = userEvent.setup()
    fakeApi({ answer: async () => json({ kind: 'navigate', place: 'apiDocs' }) })
    renderRoute('/')

    await askQuestion(user, 'API docs?')
    const link = await within(card()).findByRole('link', { name: /API documentation/ })
    expect(link).toHaveAttribute('href', `${API_URL}/docs`)
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('explains questions it cannot help with, and errors', async () => {
    const user = userEvent.setup()
    const answers = [
      json({ kind: 'none' }),
      json({ error: { code: 'rate_limited' } }, 429),
      json({ kind: 'navigate', place: 'https://example.com' }),
    ]
    fakeApi({ answer: async () => answers.shift()! })
    renderRoute('/')

    await askQuestion(user, 'weather tomorrow?')
    expect(await within(card()).findByText(/I can only help with pages and data in JalaSpace/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ask' }))
    expect(await within(card()).findByRole('alert')).toHaveTextContent('Too many questions.')

    await user.click(screen.getByRole('button', { name: 'Ask' }))
    expect(await within(card()).findByRole('alert')).toHaveTextContent('The AI could not turn this into a search.')
  })

  it('asks for a question before sending anything', async () => {
    const user = userEvent.setup()
    const fetch = fakeApi()
    renderRoute('/')

    await user.click(await screen.findByRole('button', { name: 'Ask' }))

    expect(within(card()).getByRole('alert')).toHaveTextContent('Write a question first.')
    expect(fetch.mock.calls.some(([url]) => String(url).endsWith('/api/ask'))).toBe(false)
  })

  it('is translated to Finnish', async () => {
    window.localStorage.setItem('jalaspace_language', JSON.stringify('fi'))
    const user = userEvent.setup()
    fakeApi()
    renderRoute('/')

    await user.type(await screen.findByLabelText('Kysymyksesi'), 'kolmio saunalla')
    await user.click(screen.getByRole('button', { name: 'Kysy' }))

    const panel = screen.getByRole('region', { name: 'Kysy JalaSpacelta' })
    expect(await within(panel).findByText('6 tilaa löytyi')).toBeInTheDocument()
    expect(within(panel).getByText('Ominaisuudet: Sauna')).toBeInTheDocument()
    expect(within(panel).getByText('Tyyppi: Asunto')).toBeInTheDocument()
  })
})
