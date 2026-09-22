import { describe, expect, it } from 'vitest'
import { createDataLayer } from '../repositories'
import { parseDataProvider } from './dataProvider'

describe('data provider configuration', () => {
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

  it('reports that the api provider is not implemented yet', () => {
    expect(() => createDataLayer('api')).toThrow('not implemented yet')
  })
})
