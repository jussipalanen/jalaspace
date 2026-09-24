import { describe, expect, it, vi } from 'vitest'
import { AskError, type AskAnswer, type AskInterpreter } from '../ai/ask.ts'
import { RateLimiter } from '../ai/rateLimit.ts'
import type { MaintenanceSuggester } from '../ai/suggestions.ts'
import { createApp, type AppOptions } from '../app.ts'
import { serve } from '../test/serve.ts'

const found: AskAnswer = { kind: 'search', area: 'spaces', filter: { features: ['sauna'] }, ignored: [] }

function fakeInterpreter(result: AskAnswer | AskError = found) {
  return {
    interpret: vi.fn<AskInterpreter['interpret']>(async () => {
      if (result instanceof AskError) throw result
      return result
    }),
  }
}

async function start(options: AppOptions) {
  const base = await serve(createApp({ logError: () => {}, ...options }))
  const ask = (body: unknown) =>
    fetch(`${base}/api/ask`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  return { base, ask }
}

const question = { question: 'spaces with a sauna', today: '2026-09-24' }

describe('ask API', () => {
  it('returns the answer for a question', async () => {
    const interpreter = fakeInterpreter()
    const { ask } = await start({ interpreter })

    const response = await ask(question)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(found)
    expect(interpreter.interpret).toHaveBeenCalledWith(question)
  })

  it('validates the request before asking the AI', async () => {
    const interpreter = fakeInterpreter()
    const { ask } = await start({ interpreter })

    const response = await ask({ question: '', today: 'tomorrow' })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: { code: 'validation_failed', fields: { question: 'required', today: 'invalid' } },
    })
    expect(interpreter.interpret).not.toHaveBeenCalled()
  })

  it('answers ai_unavailable when no AI provider is configured, and reports the feature', async () => {
    const off = await start({})
    expect((await off.ask(question)).status).toBe(503)
    expect(await (await fetch(`${off.base}/api/features`)).json()).toEqual({ maintenanceSuggestions: false, ask: false })

    const on = await start({ interpreter: fakeInterpreter() })
    expect(await (await fetch(`${on.base}/api/features`)).json()).toEqual({ maintenanceSuggestions: false, ask: true })
  })

  it.each([
    ['invalid_answer', 502],
    ['rate_limited', 429],
    ['ai_unavailable', 503],
  ] as const)('turns %s into status %d without logging the question', async (code, status) => {
    const logError = vi.fn()
    const base = await serve(
      createApp({ interpreter: fakeInterpreter(new AskError(code, 'details')), logError }),
    )

    const response = await fetch(`${base}/api/ask`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(question),
    })

    expect(response.status).toBe(status)
    expect(await response.json()).toEqual({ error: { code } })
    expect(JSON.stringify(logError.mock.calls)).not.toContain('sauna')
  })

  it('shares the rate limit with maintenance suggestions', async () => {
    const suggester: MaintenanceSuggester = {
      suggest: async () => ({ title: 'Leak', description: 'Leak.', category: 'plumbing', priority: 'high' }),
    }
    const { base, ask } = await start({
      interpreter: fakeInterpreter(),
      suggester,
      suggestionRateLimiter: new RateLimiter({ limit: 2, windowMs: 60_000 }),
    })
    const suggest = () =>
      fetch(`${base}/api/maintenance/suggestions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ description: 'Leak' }),
      })

    expect((await suggest()).status).toBe(200)
    expect((await ask(question)).status).toBe(200)
    const limited = await ask(question)
    expect(limited.status).toBe(429)
    expect(limited.headers.get('retry-after')).toBe('60')
  })
})
