import { describe, expect, it } from 'vitest'
import { createSeedData } from '../data/seed'
import type { Property } from '../types/property'
import {
  addressSearchText,
  applyPropertyChanges,
  buildNewProperty,
  checkPropertyDeletion,
  emptyPropertyForm,
  matchesPropertySearch,
  summarizeProperties,
  toLocation,
  toPropertyForm,
  validatePropertyForm,
  type PropertyFormValues,
} from './properties'

const valid: PropertyFormValues = {
  name: 'Oulu Tech Campus',
  type: 'office',
  address: 'Kauppurienkatu 3',
  postalCode: '90100',
  city: 'Oulu',
  description: '',
  latitude: '',
  longitude: '',
  zoom: 16,
}

const seed = createSeedData(new Date('2026-09-22T10:30:00.000Z'))

const NOW = '2026-09-22T10:30:00.000Z'

describe('validatePropertyForm', () => {
  it('accepts a complete property', () => {
    expect(validatePropertyForm(valid)).toEqual({})
  })

  it('requires name, address, postal code and city', () => {
    expect(validatePropertyForm(emptyPropertyForm())).toEqual({
      name: 'required',
      address: 'required',
      postalCode: 'required',
      city: 'required',
    })
  })

  it('treats whitespace as empty', () => {
    expect(validatePropertyForm({ ...valid, name: '   ', city: '\t' })).toEqual({
      name: 'required',
      city: 'required',
    })
  })

  it.each(['8010', '801000', '80 100', 'abcde'])('rejects the postal code "%s"', (postalCode) => {
    expect(validatePropertyForm({ ...valid, postalCode }).postalCode).toBe('invalid')
  })

  it('limits the name and description length', () => {
    expect(validatePropertyForm({ ...valid, name: 'x'.repeat(100) })).toEqual({})
    expect(validatePropertyForm({ ...valid, name: 'x'.repeat(101) }).name).toBe('tooLong')
    expect(validatePropertyForm({ ...valid, description: 'x'.repeat(1001) }).description).toBe(
      'tooLong',
    )
  })
})

describe('property location in the form', () => {
  it('is optional', () => {
    expect(validatePropertyForm({ ...valid, latitude: ' ', longitude: '' })).toEqual({})
  })

  it('accepts both coordinates', () => {
    expect(validatePropertyForm({ ...valid, latitude: '65.012', longitude: '25,4651' })).toEqual({})
  })

  it('needs both coordinates', () => {
    expect(validatePropertyForm({ ...valid, latitude: '65.012' })).toEqual({ longitude: 'required' })
    expect(validatePropertyForm({ ...valid, longitude: '25.465' })).toEqual({ latitude: 'required' })
  })

  it('rejects text and out-of-range coordinates', () => {
    expect(validatePropertyForm({ ...valid, latitude: '91', longitude: 'east' })).toEqual({
      latitude: 'invalid',
      longitude: 'invalid',
    })
  })

  it('round-trips a stored location and its zoom level through the form', () => {
    const location = { latitude: 65.012089, longitude: 25.465077, zoom: 18 }
    const property = buildNewProperty(
      { ...valid, latitude: '65.012089', longitude: '25,465077', zoom: 18 },
      NOW,
      'p1',
    )
    expect(property.location).toEqual(location)
    expect(toPropertyForm(property)).toMatchObject({ latitude: '65.012089', longitude: '25.465077', zoom: 18 })
    expect(toLocation(toPropertyForm(property))).toEqual(location)
  })

  it('uses zoom level 16 for a new form, a missing zoom level or an invalid one', () => {
    expect(emptyPropertyForm().zoom).toBe(16)
    const property = buildNewProperty(valid, NOW, 'p1')
    const legacy = { ...property, location: { latitude: 65, longitude: 25 } } as unknown as Property
    expect(toPropertyForm(legacy).zoom).toBe(16)
    expect(toLocation({ latitude: '65', longitude: '25', zoom: 25 })).toEqual({ latitude: 65, longitude: 25, zoom: 16 })
    expect(toLocation({ latitude: '65', longitude: '25', zoom: 1.5 })?.zoom).toBe(16)
  })

  it('stores no location when both coordinates are empty', () => {
    expect(buildNewProperty(valid, NOW, 'p1').location).toBeNull()
    const located = buildNewProperty({ ...valid, latitude: '65', longitude: '25' }, NOW, 'p1')
    expect(applyPropertyChanges(located, { ...valid, latitude: '', longitude: '' }, NOW).location).toBeNull()
  })

  it('treats data saved before locations existed as no location', () => {
    const { location: _location, ...legacy } = buildNewProperty(valid, NOW, 'p1')
    expect(toPropertyForm(legacy as Property)).toMatchObject({ latitude: '', longitude: '' })
  })

  it('builds the address search from the address fields', () => {
    expect(addressSearchText(valid)).toBe('Kauppurienkatu 3, 90100 Oulu')
    expect(addressSearchText({ address: ' Kauppurienkatu 3 ', postalCode: '', city: ' Oulu ' })).toBe(
      'Kauppurienkatu 3, Oulu',
    )
    expect(addressSearchText({ address: '', postalCode: '', city: '' })).toBe('')
  })
})

describe('building property entities', () => {
  it('creates a trimmed property with timestamps and a UUID', () => {
    const property = buildNewProperty(
      { ...valid, name: '  Oulu Tech Campus ', postalCode: ' 90100 ' },
      '2026-09-22T10:30:00.000Z',
    )

    expect(property).toMatchObject({
      name: 'Oulu Tech Campus',
      postalCode: '90100',
      createdAt: '2026-09-22T10:30:00.000Z',
      updatedAt: '2026-09-22T10:30:00.000Z',
    })
    expect(property.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('updates fields and updatedAt but keeps the id and createdAt', () => {
    const original = buildNewProperty(valid, '2026-01-01T00:00:00.000Z', 'p1')
    const updated = applyPropertyChanges(
      original,
      { ...valid, city: ' Oulunsalo ' },
      '2026-09-22T10:30:00.000Z',
    )

    expect(updated).toEqual({
      ...original,
      city: 'Oulunsalo',
      updatedAt: '2026-09-22T10:30:00.000Z',
    })
  })
})

describe('summarizeProperties', () => {
  const summaries = summarizeProperties(seed.properties, seed.spaces, seed.maintenance, 'en-GB')

  it('adds per-property space and maintenance metrics', () => {
    const joensuu = summaries.find((s) => s.property.name === 'Joensuu Center')!
    expect(joensuu).toMatchObject({
      spaceCount: 22,
      occupiedSpaceCount: 19,
      availableSpaceCount: 2,
      occupancyPercent: 86,
      openMaintenanceCount: 3,
    })
  })

  it('adds up to the portfolio totals', () => {
    const total = (key: 'spaceCount' | 'occupiedSpaceCount' | 'openMaintenanceCount') =>
      summaries.reduce((sum, s) => sum + s[key], 0)
    expect(total('spaceCount')).toBe(68)
    expect(total('occupiedSpaceCount')).toBe(58)
    expect(total('openMaintenanceCount')).toBe(10)
  })

  it('sorts by name and shows "no data" occupancy for properties without spaces', () => {
    const empty = buildNewProperty({ ...valid, name: 'Aalto House' }, '2026-09-22T10:30:00.000Z')
    const result = summarizeProperties([...seed.properties, empty], seed.spaces, [], 'en-GB')

    expect(result[0]?.property.name).toBe('Aalto House')
    expect(result[0]?.occupancyPercent).toBeNull()
    expect(result.map((s) => s.property.name)).toEqual(
      result.map((s) => s.property.name).toSorted(),
    )
  })
})

describe('matchesPropertySearch', () => {
  const property: Property = buildNewProperty(
    { ...valid, name: 'Ähtäri Logistics', city: 'Ähtäri', postalCode: '63700' },
    '2026-09-22T10:30:00.000Z',
  )

  it.each(['', '  ', 'ähtäri', 'ÄHTÄRI', 'logistics', '63700', 'kauppurienkatu', 'ähtäri 637'])(
    'matches "%s"',
    (query) => {
      expect(matchesPropertySearch(property, query, 'fi-FI')).toBe(true)
    },
  )

  it.each(['oulu', 'ahtari', 'logistics tampere'])('does not match "%s"', (query) => {
    expect(matchesPropertySearch(property, query, 'fi-FI')).toBe(false)
  })
})

describe('checkPropertyDeletion', () => {
  it('blocks deleting a property with spaces or maintenance tasks', () => {
    expect(checkPropertyDeletion('property-joensuu-center', seed.spaces, seed.maintenance)).toEqual({
      allowed: false,
      spaceCount: 22,
      maintenanceCount: 4,
    })
  })

  it('blocks deleting a property that only has maintenance tasks', () => {
    const task = { ...seed.maintenance[0]!, propertyId: 'p-new', spaceId: null }
    expect(checkPropertyDeletion('p-new', seed.spaces, [task])).toMatchObject({
      allowed: false,
      maintenanceCount: 1,
    })
  })

  it('allows deleting a property nothing refers to', () => {
    expect(checkPropertyDeletion('p-new', seed.spaces, seed.maintenance)).toEqual({
      allowed: true,
      spaceCount: 0,
      maintenanceCount: 0,
    })
  })
})
