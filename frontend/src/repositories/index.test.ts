import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDataLayer } from '.'

describe('createDataLayer with the api provider', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('gives properties from an older API version a location and zoom level', async () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test')
    const base = { name: 'Joensuu Center', createdAt: '2026-01-01T00:00:00.000Z' }
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        Response.json([
          { ...base, id: 'without-location' },
          { ...base, id: 'without-zoom', location: { latitude: 62.6, longitude: 29.76 } },
          { ...base, id: 'with-zoom', location: { latitude: 62.6, longitude: 29.76, zoom: 18 } },
        ]),
      ),
    )

    const properties = await createDataLayer('api').properties.getAll()

    expect(properties.map((property) => property.location)).toEqual([
      null,
      { latitude: 62.6, longitude: 29.76, zoom: 16 },
      { latitude: 62.6, longitude: 29.76, zoom: 18 },
    ])
  })
})
