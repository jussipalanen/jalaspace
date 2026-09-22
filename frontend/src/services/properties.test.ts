import { describe, expect, it } from 'vitest'
import { createSeedData } from '../data/seed'
import type { Property } from '../types/property'
import {
  applyPropertyChanges,
  buildNewProperty,
  checkPropertyDeletion,
  emptyPropertyForm,
  matchesPropertySearch,
  summarizeProperties,
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
}

const seed = createSeedData(new Date('2026-09-22T10:30:00.000Z'))

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
