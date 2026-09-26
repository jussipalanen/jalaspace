import { describe, expect, it, vi } from 'vitest'
import {
  ADDRESS_SEARCH_LIMIT,
  AddressSearchError,
  createAddressSearch,
  parseAddressMatches,
  type AddressSearchDependencies,
} from './addressSearch'

const siltakatu = {
  lat: '62.6015794',
  lon: '29.7620793',
  display_name: '12, Siltakatu, Keskusta, Joensuu, 80100, Suomi / Finland',
}

function setup(respond: () => Promise<Response> = async () => Response.json([siltakatu])) {
  let now = 10_000
  const dependencies: AddressSearchDependencies = {
    fetch: vi.fn(respond),
    now: () => now,
    wait: vi.fn(async (ms: number) => {
      now += ms
    }),
  }
  return {
    search: createAddressSearch(dependencies),
    dependencies,
    advance: (ms: number) => {
      now += ms
    },
    requestedUrl: (call = 0) => new URL(String(vi.mocked(dependencies.fetch).mock.calls[call]![0])),
  }
}

describe('parseAddressMatches', () => {
  it('reads the label and rounded location of each match', () => {
    expect(parseAddressMatches([siltakatu])).toEqual([
      { label: siltakatu.display_name, location: { latitude: 62.601579, longitude: 29.762079 } },
    ])
  })

  it('skips malformed matches and repeated labels', () => {
    const matches = parseAddressMatches([
      null,
      'Siltakatu',
      { lat: 62.6, lon: '29.7', display_name: 'numbers instead of text' },
      { lat: '95', lon: '29.7', display_name: 'latitude out of range' },
      { lat: '62.6', lon: '29.7', display_name: ' ' },
      siltakatu,
      { ...siltakatu, lat: '62.6016' },
    ])
    expect(matches.map((match) => match.label)).toEqual([siltakatu.display_name])
  })

  it(`returns at most ${ADDRESS_SEARCH_LIMIT} matches`, () => {
    const many = Array.from({ length: 8 }, (_, index) => ({ ...siltakatu, display_name: `Match ${index}` }))
    expect(parseAddressMatches(many)).toHaveLength(ADDRESS_SEARCH_LIMIT)
  })

  it('treats anything but a list as no matches', () => {
    expect(parseAddressMatches({ error: 'Bad request' })).toEqual([])
  })
})

describe('createAddressSearch', () => {
  it('searches Finland in the requested language', async () => {
    const { search, requestedUrl } = setup()

    const matches = await search('  Siltakatu 12,   80100 Joensuu ', 'fi')

    expect(matches).toHaveLength(1)
    const url = requestedUrl()
    expect(url.origin + url.pathname).toBe('https://nominatim.openstreetmap.org/search')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      q: 'Siltakatu 12, 80100 Joensuu',
      format: 'jsonv2',
      limit: String(ADDRESS_SEARCH_LIMIT),
      countrycodes: 'fi',
      'accept-language': 'fi',
    })
  })

  it('does not send an empty search', async () => {
    const { search, dependencies } = setup()
    expect(await search('   ', 'en')).toEqual([])
    expect(dependencies.fetch).not.toHaveBeenCalled()
  })

  it('answers a repeated search from the cache, ignoring case and spaces', async () => {
    const { search, dependencies } = setup()
    await search('Siltakatu 12, Joensuu', 'en')
    await search(' siltakatu 12,  joensuu', 'en')
    expect(dependencies.fetch).toHaveBeenCalledTimes(1)

    await search('Siltakatu 12, Joensuu', 'fi')
    expect(dependencies.fetch).toHaveBeenCalledTimes(2)
  })

  it('waits so that it sends at most one request per second', async () => {
    const { search, dependencies, advance } = setup()
    await search('Siltakatu 12', 'en')
    expect(dependencies.wait).not.toHaveBeenCalled()

    advance(300)
    await search('Satamakatu 5', 'en')
    expect(dependencies.wait).toHaveBeenCalledWith(700)

    advance(1500)
    await search('Hermiankatu 20', 'en')
    expect(dependencies.wait).toHaveBeenCalledTimes(1)
  })

  it('reports a failed request or an unreadable answer', async () => {
    for (const respond of [
      async () => new Response('Too many requests', { status: 429 }),
      async () => new Response('<html>', { status: 200 }),
      async () => {
        throw new TypeError('Failed to fetch')
      },
    ]) {
      const { search } = setup(respond)
      await expect(search('Siltakatu 12', 'en')).rejects.toEqual(new AddressSearchError('failed'))
    }
  })

  it('does not cache a failed search', async () => {
    let fail = true
    const { search, dependencies } = setup(async () => (fail ? new Response('', { status: 503 }) : Response.json([siltakatu])))
    await expect(search('Siltakatu 12', 'en')).rejects.toBeInstanceOf(AddressSearchError)
    fail = false
    expect(await search('Siltakatu 12', 'en')).toHaveLength(1)
    expect(dependencies.fetch).toHaveBeenCalledTimes(2)
  })
})
