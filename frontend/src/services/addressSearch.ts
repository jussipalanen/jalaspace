import type { Language } from '../i18n/languages'
import type { GeoLocation } from '../types/property'
import { parseCoordinate } from './location'

// Address search with OpenStreetMap Nominatim. The public service is free but
// has a usage policy (https://operations.osmfoundation.org/policies/nominatim/):
// no autocomplete, at most one request per second, and repeated searches should
// be cached. The browser's Referer header identifies the app.

export const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search'

/** Matches shown to the user. */
export const ADDRESS_SEARCH_LIMIT = 5

/** Longer queries are not addresses; the field refuses them. */
export const ADDRESS_SEARCH_MAX_LENGTH = 200

/** Nominatim allows at most one request per second. */
const MIN_REQUEST_INTERVAL_MS = 1000

const TIMEOUT_MS = 15_000

export interface AddressMatch {
  /** The full address as OpenStreetMap writes it, in the requested language. */
  label: string
  location: GeoLocation
}

/** Why a search failed; the UI translates it (`properties.location.search.errors.<code>`). */
export type AddressSearchErrorCode = 'failed'

export class AddressSearchError extends Error {
  readonly code: AddressSearchErrorCode

  constructor(code: AddressSearchErrorCode) {
    super(code)
    this.name = 'AddressSearchError'
    this.code = code
  }
}

export interface AddressSearchDependencies {
  fetch: typeof fetch
  now: () => number
  wait: (ms: number) => Promise<void>
}

const defaultDependencies: AddressSearchDependencies = {
  fetch: (...args) => globalThis.fetch(...args),
  now: () => Date.now(),
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}

/** Reads the matches from a Nominatim answer, skipping anything malformed. */
export function parseAddressMatches(body: unknown): AddressMatch[] {
  if (!Array.isArray(body)) return []
  const matches: AddressMatch[] = []
  for (const item of body as unknown[]) {
    if (typeof item !== 'object' || item === null) continue
    const { lat, lon, display_name: label } = item as Record<string, unknown>
    if (typeof lat !== 'string' || typeof lon !== 'string' || typeof label !== 'string') continue
    const latitude = parseCoordinate(lat, 'latitude')
    const longitude = parseCoordinate(lon, 'longitude')
    if (latitude === null || longitude === null || !label.trim()) continue
    // Shops and offices in the same building come back as separate matches.
    if (matches.some((match) => match.label === label)) continue
    matches.push({ label, location: { latitude, longitude } })
  }
  return matches.slice(0, ADDRESS_SEARCH_LIMIT)
}

/**
 * Creates an address search that caches its answers and waits between
 * requests. Searches are limited to Finland, like the postal code rule.
 */
export function createAddressSearch(dependencies: AddressSearchDependencies = defaultDependencies) {
  const cache = new Map<string, AddressMatch[]>()
  let lastRequestAt = Number.NEGATIVE_INFINITY

  return async function searchAddress(query: string, language: Language): Promise<AddressMatch[]> {
    const text = query.trim().replace(/\s+/g, ' ')
    if (!text) return []

    const cacheKey = `${language}:${text.toLocaleLowerCase()}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const waitMs = lastRequestAt + MIN_REQUEST_INTERVAL_MS - dependencies.now()
    if (waitMs > 0) await dependencies.wait(waitMs)
    lastRequestAt = dependencies.now()

    const url = new URL(NOMINATIM_SEARCH_URL)
    url.search = new URLSearchParams({
      q: text,
      format: 'jsonv2',
      limit: String(ADDRESS_SEARCH_LIMIT),
      countrycodes: 'fi',
      'accept-language': language,
    }).toString()

    let body: unknown
    try {
      const response = await dependencies.fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (!response.ok) throw new AddressSearchError('failed')
      body = await response.json()
    } catch {
      throw new AddressSearchError('failed')
    }

    const matches = parseAddressMatches(body)
    cache.set(cacheKey, matches)
    return matches
  }
}

export const searchAddress = createAddressSearch()
