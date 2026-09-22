import { describe, expect, it, vi } from 'vitest'
import { GeminiSuggester } from './gemini.ts'
import { SuggestionError } from './suggestions.ts'

const answer = (text: string, extraParts: object[] = []) =>
  new Response(
    JSON.stringify({ candidates: [{ content: { role: 'model', parts: [...extraParts, { text }] } }] }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )

const suggestion = {
  title: 'Kitchen sink leak',
  description: 'Water leaks under the kitchen sink.',
  category: 'plumbing',
  priority: 'high',
}

function setup(response: Response | (() => Promise<Response>)) {
  const fetch = vi.fn<typeof globalThis.fetch>(
    typeof response === 'function' ? response : async () => response,
  )
  const suggester = new GeminiSuggester({ apiKey: 'test-key', model: 'gemini-test', fetch })
  return { fetch, suggester }
}

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise
  } catch (error) {
    if (error instanceof SuggestionError) return error.code
    throw error
  }
  throw new Error('Expected the suggestion to fail')
}

describe('Gemini suggester', () => {
  it('asks Gemini for JSON and returns the checked suggestion', async () => {
    const { fetch, suggester } = setup(answer(JSON.stringify(suggestion)))

    const result = await suggester.suggest({ title: '', description: 'Water under the sink', language: 'fi' })

    expect(result).toEqual(suggestion)
    const [url, init] = fetch.mock.calls[0]!
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent')
    expect(String(url)).not.toContain('test-key')
    expect(init?.headers).toMatchObject({ 'x-goog-api-key': 'test-key' })
    const body = JSON.parse(String(init?.body))
    expect(body.contents).toEqual([{ role: 'user', parts: [{ text: 'Description: Water under the sink' }] }])
    expect(body.systemInstruction.parts[0].text).toContain('Write the title and the description in Finnish.')
    expect(body.systemInstruction.parts[0].text).toContain('The heading of the list is: Tarkistettavaa:')
    expect(body.generationConfig).toMatchObject({ responseMimeType: 'application/json' })
    expect(body.generationConfig.responseSchema.properties.category.enum).toContain('hvac')
    expect(body.generationConfig.responseSchema.required).toContain('description')
  })

  it('sends only the fields the user filled in, labelled', async () => {
    const titleOnly = setup(answer(JSON.stringify(suggestion)))
    await titleOnly.suggester.suggest({ title: 'Kitchen sink leak', description: '', language: 'en' })
    const [, titleInit] = titleOnly.fetch.mock.calls[0]!
    const titleBody = JSON.parse(String(titleInit?.body))
    expect(titleBody.contents[0].parts[0].text).toBe('Title: Kitchen sink leak')
    expect(titleBody.systemInstruction.parts[0].text).toContain('The heading of the list is: To check:')

    const both = setup(answer(JSON.stringify(suggestion)))
    await both.suggester.suggest({ title: 'Sink leak', description: 'Since this morning', language: 'en' })
    const [, bothInit] = both.fetch.mock.calls[0]!
    expect(JSON.parse(String(bothInit?.body)).contents[0].parts[0].text).toBe(
      'Title: Sink leak\nDescription: Since this morning',
    )
  })

  it('ignores thought parts', async () => {
    const { suggester } = setup(answer(JSON.stringify(suggestion), [{ text: 'Thinking…', thought: true }]))
    expect(await suggester.suggest({ title: '', description: 'Leak', language: 'en' })).toEqual(suggestion)
  })

  it('reports an exhausted quota as rate_limited', async () => {
    const { suggester } = setup(new Response('{}', { status: 429 }))
    expect(await codeOf(suggester.suggest({ title: '', description: 'Leak', language: 'en' }))).toBe('rate_limited')
  })

  it.each([400, 403, 404, 500, 503])('reports status %i as ai_unavailable', async (status) => {
    const { suggester } = setup(new Response('{}', { status }))
    expect(await codeOf(suggester.suggest({ title: '', description: 'Leak', language: 'en' }))).toBe('ai_unavailable')
  })

  it("keeps Google's error message for the server log", async () => {
    const { suggester } = setup(
      new Response(JSON.stringify({ error: { code: 404, message: 'models/gemini-test is not found' } }), {
        status: 404,
      }),
    )
    await expect(suggester.suggest({ title: '', description: 'Leak', language: 'en' })).rejects.toThrow(
      'Gemini answered 404: models/gemini-test is not found',
    )
  })

  it('reports an unreadable response as ai_unavailable', async () => {
    const { suggester } = setup(new Response('<html>Bad gateway</html>', { status: 200 }))
    expect(await codeOf(suggester.suggest({ title: '', description: 'Leak', language: 'en' }))).toBe('ai_unavailable')
  })

  it('reports network errors and timeouts as ai_unavailable', async () => {
    const { suggester } = setup(() => Promise.reject(new TypeError('fetch failed')))
    expect(await codeOf(suggester.suggest({ title: '', description: 'Leak', language: 'en' }))).toBe('ai_unavailable')
  })

  it.each([
    ['no candidates (blocked)', new Response(JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } }))],
    ['text that is not JSON', answer('Here is my suggestion: a leak')],
    ['an unknown category', answer(JSON.stringify({ ...suggestion, category: 'water' }))],
  ])('rejects %s as invalid_suggestion', async (_case, response) => {
    const { suggester } = setup(response)
    expect(await codeOf(suggester.suggest({ title: '', description: 'Leak', language: 'en' }))).toBe('invalid_suggestion')
  })
})
