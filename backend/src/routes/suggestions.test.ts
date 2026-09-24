import { describe, expect, it, vi } from 'vitest'
import { RateLimiter } from '../ai/rateLimit.ts'
import {
  SuggestionError,
  type MaintenanceSuggester,
  type MaintenanceSuggestion,
} from '../ai/suggestions.ts'
import { createApp, type AppOptions } from '../app.ts'
import { serve } from '../test/serve.ts'

const suggestion: MaintenanceSuggestion = {
  title: 'Kitchen sink leak',
  description: 'Water leaks under the kitchen sink.',
  category: 'plumbing',
  priority: 'high',
}

function fakeSuggester(result: MaintenanceSuggestion | SuggestionError = suggestion) {
  return {
    suggest: vi.fn<MaintenanceSuggester['suggest']>(async () => {
      if (result instanceof SuggestionError) throw result
      return result
    }),
  }
}

async function start(options: AppOptions) {
  const base = await serve(createApp({ logError: () => {}, ...options }))
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    fetch(`${base}/api/maintenance/suggestions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })
  return { base, post }
}

describe('maintenance suggestions API', () => {
  it('returns the suggestion for a description', async () => {
    const suggester = fakeSuggester()
    const { post } = await start({ suggester })

    const response = await post({ description: ' Water under the sink ', language: 'fi' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(suggestion)
    expect(suggester.suggest).toHaveBeenCalledWith({
      title: '',
      description: 'Water under the sink',
      language: 'fi',
    })
  })

  it('returns a suggestion for only a title', async () => {
    const suggester = fakeSuggester()
    const { post } = await start({ suggester })

    const response = await post({ title: 'Kitchen sink leak' })

    expect(response.status).toBe(200)
    expect(suggester.suggest).toHaveBeenCalledWith({
      title: 'Kitchen sink leak',
      description: '',
      language: 'en',
    })
  })

  it('reports the feature in /api/features', async () => {
    const on = await start({ suggester: fakeSuggester() })
    const off = await start({})
    expect(await (await fetch(`${on.base}/api/features`)).json()).toEqual({ maintenanceSuggestions: true, ask: false })
    expect(await (await fetch(`${off.base}/api/features`)).json()).toEqual({ maintenanceSuggestions: false, ask: false })
  })

  it('answers ai_unavailable when no AI provider is configured', async () => {
    const { post } = await start({})
    const response = await post({ description: 'Leak' })
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: { code: 'ai_unavailable' } })
  })

  it('validates the request before asking the AI', async () => {
    const suggester = fakeSuggester()
    const { post } = await start({ suggester })

    const response = await post({ description: '', language: 'sv' })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: { code: 'validation_failed', fields: { description: 'required', language: 'invalid' } },
    })
    expect(suggester.suggest).not.toHaveBeenCalled()
  })

  it.each([
    ['ai_unavailable', 503],
    ['rate_limited', 429],
    ['invalid_suggestion', 502],
  ] as const)('turns a %s failure into status %i with the code', async (code, status) => {
    const logError = vi.fn()
    const { post } = await start({ suggester: fakeSuggester(new SuggestionError(code, 'details')), logError })

    const response = await post({ description: 'Leak' })

    expect(response.status).toBe(status)
    expect(await response.json()).toEqual({ error: { code } })
    expect(logError).toHaveBeenCalledWith('Maintenance suggestion failed: details')
  })

  it('limits requests per client and says when to retry', async () => {
    const suggester = fakeSuggester()
    const { post } = await start({
      suggester,
      suggestionRateLimiter: new RateLimiter({ limit: 2, windowMs: 60_000 }),
    })

    expect((await post({ description: 'Leak' })).status).toBe(200)
    expect((await post({ description: 'Leak' })).status).toBe(200)
    const limited = await post({ description: 'Leak' })

    expect(limited.status).toBe(429)
    expect(await limited.json()).toEqual({ error: { code: 'rate_limited' } })
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0)
    expect(suggester.suggest).toHaveBeenCalledTimes(2)
  })

  it('counts clients by their forwarded IP behind a trusted proxy', async () => {
    const { post } = await start({
      suggester: fakeSuggester(),
      suggestionRateLimiter: new RateLimiter({ limit: 1, windowMs: 60_000 }),
      trustProxy: 1,
    })
    const from = (ip: string) => post({ description: 'Leak' }, { 'x-forwarded-for': ip })

    expect((await from('203.0.113.1')).status).toBe(200)
    expect((await from('203.0.113.2')).status).toBe(200)
    expect((await from('203.0.113.1')).status).toBe(429)
  })

  it('ignores forwarded IPs when no proxy is trusted, so they cannot be spoofed', async () => {
    const { post } = await start({
      suggester: fakeSuggester(),
      suggestionRateLimiter: new RateLimiter({ limit: 1, windowMs: 60_000 }),
    })
    const from = (ip: string) => post({ description: 'Leak' }, { 'x-forwarded-for': ip })

    expect((await from('203.0.113.1')).status).toBe(200)
    expect((await from('203.0.113.2')).status).toBe(429)
  })
})
