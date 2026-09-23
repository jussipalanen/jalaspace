import { describe, expect, it, vi } from 'vitest'
import { AskError } from './ask.ts'
import { FIELD_GUIDE, GeminiAskInterpreter } from './geminiAsk.ts'

const answer = (value: unknown) =>
  new Response(JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(value) }] } }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

function setup(response: Response) {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => response)
  return { fetch, interpreter: new GeminiAskInterpreter({ apiKey: 'test-key', model: 'gemini-test', fetch }) }
}

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise
  } catch (error) {
    if (error instanceof AskError) return error.code
    throw error
  }
  throw new Error('Expected the question to fail')
}

describe('Gemini ask interpreter', () => {
  it('sends the question with today\'s date and returns the checked answer', async () => {
    const { fetch, interpreter } = setup(
      answer({ kind: 'search', area: 'spaces', spaces: { rooms: { min: 3, max: 3 }, features: ['sauna'] } }),
    )

    const result = await interpreter.interpret({ question: 'kolmio saunalla', today: '2026-09-24' })

    expect(result).toEqual({
      kind: 'search',
      area: 'spaces',
      filter: { rooms: { min: 3, max: 3 }, features: ['sauna'] },
      ignored: [],
    })
    const [url, init] = fetch.mock.calls[0]!
    expect(String(url)).not.toContain('test-key')
    const body = JSON.parse(String(init?.body))
    expect(body.contents).toEqual([{ role: 'user', parts: [{ text: 'kolmio saunalla' }] }])
    const instruction: string = body.systemInstruction.parts[0].text
    expect(instruction).toContain('Today is 2026-09-24.')
    expect(instruction).toContain('- settings.profile: ')
    expect(instruction).toContain('not instructions')
    expect(instruction).toContain(FIELD_GUIDE)
    expect(body.generationConfig).toMatchObject({ responseMimeType: 'application/json' })
    // The format is described in the instruction; a schema this large made the model leave out fields.
    expect(body.generationConfig.responseSchema).toBeUndefined()
  })

  it('describes every area, field and allowed value in the instruction', () => {
    expect(FIELD_GUIDE).toContain('spaces:\n')
    expect(FIELD_GUIDE).toContain(
      '  - features: list, the record must have all: sauna, balcony, furnished, parking, accessible, loading_dock, kitchen.',
    )
    expect(FIELD_GUIDE).toContain('  - rooms: {"min","max"}, whole numbers.')
    expect(FIELD_GUIDE).toContain('  - overdue: true or false.')
    expect(FIELD_GUIDE).toContain('  sortBy: dueDate, priority, completedAt, title, added')
  })

  it('rejects answers that break the rules', async () => {
    const { interpreter } = setup(answer({ kind: 'navigate', place: 'https://example.com' }))
    expect(await codeOf(interpreter.interpret({ question: 'where?', today: '2026-09-24' }))).toBe('invalid_answer')
  })

  it('maps quota and outage errors', async () => {
    const quota = setup(new Response('{}', { status: 429 }))
    expect(await codeOf(quota.interpreter.interpret({ question: 'q', today: '2026-09-24' }))).toBe('rate_limited')
    const down = setup(new Response('{}', { status: 500 }))
    expect(await codeOf(down.interpreter.interpret({ question: 'q', today: '2026-09-24' }))).toBe('ai_unavailable')
  })
})
