import { describe, expect, it } from 'vitest'
import { RateLimiter } from './ai/rateLimit.ts'
import { createApp, type AppOptions } from './app.ts'
import { resetDemoData } from './domain/demoData.ts'
import { DEFAULT_COLLECTION_LIMITS } from './limits.ts'
import { createMemoryStore } from './store/memoryStore.ts'
import { serve } from './test/serve.ts'

const property = {
  name: 'Oulu Office House',
  type: 'office',
  address: 'Kauppurienkatu 3',
  postalCode: '90100',
  city: 'Oulu',
}

async function start(options: AppOptions = {}) {
  const store = options.store ?? createMemoryStore()
  const base = await serve(createApp({ ...options, store }))
  const send = (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
    fetch(`${base}/api${path}`, {
      method,
      headers: body === undefined ? headers : { 'content-type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  return { store, send }
}

const perMinute = (limit: number) => new RateLimiter({ limit, windowMs: 60_000 })

describe('write rate limit', () => {
  it('refuses writes over the limit with Retry-After and stores nothing more', async () => {
    const { store, send } = await start({ writeRateLimiter: perMinute(2) })

    expect((await send('POST', '/properties', property)).status).toBe(201)
    expect((await send('POST', '/properties', { ...property, name: 'Second' })).status).toBe(201)
    const refused = await send('POST', '/properties', { ...property, name: 'Third' })

    expect(refused.status).toBe(429)
    expect(await refused.json()).toEqual({ error: { code: 'rate_limited' } })
    expect(Number(refused.headers.get('retry-after'))).toBeGreaterThan(0)
    expect(await store.properties.list()).toHaveLength(2)
  })

  it('counts updates and deletes, but not reads', async () => {
    const { send } = await start({ writeRateLimiter: perMinute(2) })
    const created = (await (await send('POST', '/properties', property)).json()) as { id: string }
    expect((await send('PUT', `/properties/${created.id}`, property)).status).toBe(200)

    for (let i = 0; i < 5; i++) expect((await send('GET', '/properties')).status).toBe(200)
    expect((await send('DELETE', `/properties/${created.id}`)).status).toBe(429)
  })

  it('counts each client separately', async () => {
    const { send } = await start({ writeRateLimiter: perMinute(1), trustProxy: 1 })
    const from = (ip: string) => ({ 'x-forwarded-for': ip })

    expect((await send('POST', '/properties', property, from('203.0.113.1'))).status).toBe(201)
    expect((await send('POST', '/properties', { ...property, name: 'B' }, from('203.0.113.1'))).status).toBe(429)
    expect((await send('POST', '/properties', { ...property, name: 'C' }, from('203.0.113.2'))).status).toBe(201)
  })

  it('leaves AI suggestions to their own limit', async () => {
    const { send } = await start({ writeRateLimiter: perMinute(1) })
    await send('POST', '/properties', property)

    // No AI provider in tests: the suggestions route answers, not the write limit.
    const response = await send('POST', '/maintenance/suggestions', { title: 'Leaking tap' })
    expect(await response.json()).toEqual({ error: { code: 'ai_unavailable' } })
  })
})

describe('demo reset limit', () => {
  it('allows only a few resets per client, on top of the write limit', async () => {
    const store = createMemoryStore()
    await resetDemoData(store)
    const { send } = await start({
      store,
      demoData: true,
      resetRateLimiter: new RateLimiter({ limit: 2, windowMs: 3_600_000 }),
    })

    expect((await send('POST', '/demo/reset')).status).toBe(204)
    expect((await send('POST', '/demo/reset')).status).toBe(204)
    const refused = await send('POST', '/demo/reset')

    expect(refused.status).toBe(429)
    expect(await refused.json()).toEqual({ error: { code: 'rate_limited' } })
    // Other writes are still allowed.
    expect((await send('POST', '/properties', property)).status).toBe(201)
  })
})

describe('collection limits', () => {
  const limits = { ...DEFAULT_COLLECTION_LIMITS, properties: 2 }

  it('refuses to create a record in a full collection, and stores nothing', async () => {
    const { store, send } = await start({ collectionLimits: limits })
    await send('POST', '/properties', property)
    await send('POST', '/properties', { ...property, name: 'Second' })

    const refused = await send('POST', '/properties', { ...property, name: 'Third' })

    expect(refused.status).toBe(409)
    expect(await refused.json()).toEqual({ error: { code: 'limit_reached', limit: 2 } })
    expect(await store.properties.list()).toHaveLength(2)
  })

  it('still allows updates and deletes, so a full collection can be cleaned up', async () => {
    const { send } = await start({ collectionLimits: limits })
    const first = (await (await send('POST', '/properties', property)).json()) as { id: string }
    await send('POST', '/properties', { ...property, name: 'Second' })

    expect((await send('PUT', `/properties/${first.id}`, { ...property, name: 'Renamed' })).status).toBe(200)
    expect((await send('DELETE', `/properties/${first.id}`)).status).toBe(204)
    expect((await send('POST', '/properties', { ...property, name: 'Third' })).status).toBe(201)
  })

  it('leaves plenty of room above the demo data', async () => {
    const store = createMemoryStore()
    await resetDemoData(store)
    const counts = {
      properties: (await store.properties.list()).length,
      spaces: (await store.spaces.list()).length,
      maintenance: (await store.maintenance.list()).length,
      tenants: (await store.tenants.list()).length,
      leases: (await store.leases.list()).length,
    }
    for (const [name, count] of Object.entries(counts)) {
      expect(DEFAULT_COLLECTION_LIMITS[name as keyof typeof counts], name).toBeGreaterThanOrEqual(count * 5)
    }
  })
})
