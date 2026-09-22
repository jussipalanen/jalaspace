import { describe, expect, it } from 'vitest'
import { createApp } from '../app.ts'
import { resetDemoData } from '../domain/demoData.ts'
import { createMemoryStore } from '../store/memoryStore.ts'
import { serve } from '../test/serve.ts'

const propertyNames = async (base: string) =>
  ((await (await fetch(`${base}/api/properties`)).json()) as { name: string }[]).map(({ name }) => name)

const DEMO_NAMES = [
  'Joensuu Center',
  'Kuopio Harbour Business Park',
  'Tampere Hervanta Logistics',
  'Helsinki Kallio Residences',
]

describe('demo data API', () => {
  it('restores the demo data, undoing changes', async () => {
    const store = createMemoryStore()
    await resetDemoData(store)
    const base = await serve(createApp({ store, demoData: true }))
    expect(await propertyNames(base)).toEqual(DEMO_NAMES)

    await fetch(`${base}/api/properties/property-joensuu-center`, { method: 'DELETE' })
    await fetch(`${base}/api/properties`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'New',
        type: 'office',
        address: 'Katu 1',
        postalCode: '00100',
        city: 'Helsinki',
      }),
    })
    expect(await propertyNames(base)).toEqual([...DEMO_NAMES.slice(1), 'New'])

    const response = await fetch(`${base}/api/demo/reset`, { method: 'POST' })

    expect(response.status).toBe(204)
    expect(await propertyNames(base)).toEqual(DEMO_NAMES)
  })

  it('has no reset endpoint unless the demo data is enabled', async () => {
    const store = createMemoryStore()
    const base = await serve(createApp({ store }))

    const response = await fetch(`${base}/api/demo/reset`, { method: 'POST' })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: { code: 'not_found' } })
    expect(await store.properties.list()).toEqual([])
  })
})
