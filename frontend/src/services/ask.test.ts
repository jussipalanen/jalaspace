import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { AskRequestError, parseAskAnswer, requestAskAnswer } from './ask'

const API_URL = 'http://api.test'
const question = 'available three-room apartment with a sauna, cheap'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

function codeOf(run: () => unknown): string {
  try {
    run()
  } catch (error) {
    if (error instanceof AskRequestError) return error.code
    throw error
  }
  throw new Error('Expected the answer to be rejected')
}

describe('checking an answer', () => {
  it('accepts a known place, a search and none', () => {
    expect(parseAskAnswer({ kind: 'navigate', place: 'apiDocs' }, question)).toEqual({
      kind: 'navigate',
      place: 'apiDocs',
    })
    expect(
      parseAskAnswer(
        {
          kind: 'search',
          area: 'spaces',
          filter: { types: ['apartment'], rooms: { min: 3, max: 3 }, features: ['sauna'] },
          sort: { by: 'areaM2', direction: 'desc' },
          ignored: ['cheap', 'luxury'],
        },
        question,
      ),
    ).toEqual({
      kind: 'search',
      area: 'spaces',
      filter: { types: ['apartment'], rooms: { min: 3, max: 3 }, features: ['sauna'] },
      sort: { by: 'areaM2', direction: 'desc' },
      // Only words that are in the question are shown.
      ignored: ['cheap'],
    })
    expect(parseAskAnswer({ kind: 'none' }, question)).toEqual({ kind: 'none' })
  })

  it.each([
    ['an unknown place', { kind: 'navigate', place: 'settings.password' }],
    ['an inherited property name as a place', { kind: 'navigate', place: 'toString' }],
    ['an unknown area', { kind: 'search', area: 'owners', filter: {} }],
    ['a field of another area', { kind: 'search', area: 'spaces', filter: { priorities: ['high'] } }],
    ['an inherited property name as a field', { kind: 'search', area: 'spaces', filter: { constructor: 'x' } }],
    ['an unknown value', { kind: 'search', area: 'spaces', filter: { features: ['pool'] } }],
    ['a number out of range', { kind: 'search', area: 'spaces', filter: { rooms: { min: 51 } } }],
    ['an empty range', { kind: 'search', area: 'spaces', filter: { rooms: {} } }],
    ['an invalid date', { kind: 'search', area: 'leases', filter: { endDate: { to: '2026-02-30' } } }],
    ['a sort of another area', { kind: 'search', area: 'tenants', filter: {}, sort: { by: 'areaM2', direction: 'asc' } }],
    ['a missing filter', { kind: 'search', area: 'tenants' }],
    ['text', 'go to settings'],
  ])('rejects %s', (_case, body) => {
    expect(codeOf(() => parseAskAnswer(body, question))).toBe('invalidAnswer')
  })
})

describe('asking the API', () => {
  let fetchMock: Mock<typeof fetch>

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("sends the tidied question with the user's date", async () => {
    fetchMock.mockResolvedValue(json({ kind: 'navigate', place: 'settings.profile' }))

    const answer = await requestAskAnswer(API_URL, '  where is my\nprofile? ', '2026-09-24')

    expect(answer).toEqual({ kind: 'navigate', place: 'settings.profile' })
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe(`${API_URL}/api/ask`)
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({ question: 'where is my profile?', today: '2026-09-24' })
  })

  it('checks the question before sending it', async () => {
    await expect(requestAskAnswer(API_URL, '  ', '2026-09-24')).rejects.toMatchObject({ code: 'required' })
    await expect(requestAskAnswer(API_URL, 'x'.repeat(301), '2026-09-24')).rejects.toMatchObject({ code: 'tooLong' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    [429, { error: { code: 'rate_limited' } }, 'rateLimited'],
    [502, { error: { code: 'invalid_answer' } }, 'invalidAnswer'],
    [503, { error: { code: 'ai_unavailable' } }, 'unavailable'],
    [500, null, 'unavailable'],
  ])('maps status %d to %s', async (status, body, code) => {
    fetchMock.mockResolvedValue(json(body, status))
    await expect(requestAskAnswer(API_URL, 'question', '2026-09-24')).rejects.toMatchObject({ code })
  })

  it('reports a network failure, and an answer that breaks the rules', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(requestAskAnswer(API_URL, 'question', '2026-09-24')).rejects.toMatchObject({ code: 'network' })

    fetchMock.mockResolvedValueOnce(json({ kind: 'navigate', place: 'https://example.com' }))
    await expect(requestAskAnswer(API_URL, 'question', '2026-09-24')).rejects.toMatchObject({
      code: 'invalidAnswer',
    })
  })
})
