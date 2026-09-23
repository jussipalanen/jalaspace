import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDataLayer } from '../repositories'
import { ApiDemoDataStore } from '../repositories/api/ApiDemoDataStore'
import { ApiRepository } from '../repositories/api/ApiRepository'
import { parseDataProvider } from './dataProvider'

describe('data provider configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it.each([undefined, '', '   '])('defaults to localStorage for %j', (value) => {
    expect(parseDataProvider(value)).toBe('localStorage')
  })

  it.each(['localStorage', 'api'] as const)('accepts "%s"', (value) => {
    expect(parseDataProvider(value)).toBe(value)
  })

  it('rejects unknown providers with a helpful message', () => {
    expect(() => parseDataProvider('firebase')).toThrow(
      'Unknown VITE_DATA_PROVIDER "firebase". Expected one of: localStorage, api.',
    )
  })

  it('creates localStorage repositories and demo data support', () => {
    const dataLayer = createDataLayer('localStorage')
    expect(dataLayer.properties).toBeDefined()
    expect(dataLayer.demoData).not.toBeNull()
  })

  it('creates API repositories and demo data support when the API URL is set', () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000/')
    const dataLayer = createDataLayer('api')
    expect(dataLayer.spaces).toBeInstanceOf(ApiRepository)
    expect(dataLayer.demoData).toBeInstanceOf(ApiDemoDataStore)
  })

  it('reports a missing API URL for the api provider', () => {
    vi.stubEnv('VITE_API_URL', '')
    expect(() => createDataLayer('api')).toThrow('The "api" data provider needs VITE_API_URL')
  })
})
