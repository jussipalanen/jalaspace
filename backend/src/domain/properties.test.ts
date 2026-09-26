import { describe, expect, it } from 'vitest'
import { checkPropertyDeletion, parsePropertyInput } from './properties.ts'

const valid = {
  name: 'Joensuu Center',
  type: 'mixed_use',
  address: 'Siltakatu 12',
  postalCode: '80100',
  city: 'Joensuu',
  description: 'City-centre building.',
}

/** The parsed values of `valid`: a request without a location stores none. */
const parsed = { ...valid, location: null }

const location = { latitude: 62.601579, longitude: 29.762079, zoom: 17 }

describe('property input', () => {
  it('accepts valid input and trims the text', () => {
    const result = parsePropertyInput({ ...valid, name: '  Joensuu Center ', city: ' Joensuu' })
    expect(result).toEqual({ ok: true, values: parsed })
  })

  it('treats a missing description as empty', () => {
    const { description: _description, ...withoutDescription } = valid
    expect(parsePropertyInput(withoutDescription)).toEqual({ ok: true, values: { ...parsed, description: '' } })
  })

  it('ignores fields the client may not set', () => {
    const result = parsePropertyInput({ ...valid, id: 'mine', createdAt: 'yesterday', extra: true })
    expect(result).toEqual({ ok: true, values: parsed })
  })

  it('reports every missing required field', () => {
    expect(parsePropertyInput({ name: ' ', address: '', description: '' })).toEqual({
      ok: false,
      errors: {
        name: 'required',
        type: 'required',
        address: 'required',
        postalCode: 'required',
        city: 'required',
      },
    })
  })

  it.each([undefined, null, 'text', 42, ['name']])('treats the body %j as empty', (body) => {
    const result = parsePropertyInput(body)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors.name).toBe('required')
  })

  it.each(['8010', '801000', 'ABCDE', '80 100'])('rejects the postal code "%s"', (postalCode) => {
    expect(parsePropertyInput({ ...valid, postalCode })).toEqual({
      ok: false,
      errors: { postalCode: 'invalid' },
    })
  })

  it('limits the name to 100 and the description to 1000 characters', () => {
    expect(parsePropertyInput({ ...valid, name: 'x'.repeat(100), description: 'x'.repeat(1000) }).ok).toBe(true)
    expect(parsePropertyInput({ ...valid, name: 'x'.repeat(101), description: 'x'.repeat(1001) })).toEqual({
      ok: false,
      errors: { name: 'tooLong', description: 'tooLong' },
    })
  })

  it('rejects an unknown property type', () => {
    expect(parsePropertyInput({ ...valid, type: 'castle' })).toEqual({ ok: false, errors: { type: 'invalid' } })
  })

  it('rejects values of the wrong JSON type', () => {
    expect(parsePropertyInput({ ...valid, name: 42, city: ['Joensuu'], description: {} })).toEqual({
      ok: false,
      errors: { name: 'invalid', city: 'invalid', description: 'invalid' },
    })
  })
})

describe('property location', () => {
  it('accepts a location and stores it', () => {
    expect(parsePropertyInput({ ...valid, location })).toEqual({ ok: true, values: { ...valid, location } })
  })

  it('treats a missing or null location as no location', () => {
    expect(parsePropertyInput(valid)).toEqual({ ok: true, values: parsed })
    expect(parsePropertyInput({ ...valid, location: null })).toEqual({ ok: true, values: parsed })
  })

  it('rounds the coordinates to 6 decimals', () => {
    const result = parsePropertyInput({
      ...valid,
      location: { latitude: 62.60157949, longitude: 29.7620791234, zoom: 17 },
    })
    expect(result).toEqual({ ok: true, values: { ...valid, location } })
  })

  it('accepts the limits of latitude and longitude', () => {
    for (const edge of [
      { latitude: -90, longitude: -180, zoom: 1 },
      { latitude: 90, longitude: 180, zoom: 19 },
    ]) {
      expect(parsePropertyInput({ ...valid, location: edge })).toEqual({ ok: true, values: { ...valid, location: edge } })
    }
  })

  it('uses zoom level 16 when the location has none', () => {
    for (const zoom of [undefined, null]) {
      const result = parsePropertyInput({ ...valid, location: { latitude: 62.601579, longitude: 29.762079, zoom } })
      expect(result).toEqual({ ok: true, values: { ...valid, location: { ...location, zoom: 16 } } })
    }
  })

  it.each([
    { latitude: 91, longitude: 29 },
    { latitude: 62, longitude: 29, zoom: 0 },
    { latitude: 62, longitude: 29, zoom: 20 },
    { latitude: 62, longitude: 29, zoom: 16.5 },
    { latitude: 62, longitude: 29, zoom: '16' },
    { latitude: -90.5, longitude: 29 },
    { latitude: 62, longitude: 181 },
    { latitude: 62, longitude: -180.1 },
    { latitude: '62', longitude: 29 },
    { latitude: 62 },
    { latitude: Number.NaN, longitude: 29 },
    [62, 29],
    'Siltakatu 12',
    42,
  ])('rejects the location %j', (value) => {
    expect(parsePropertyInput({ ...valid, location: value })).toEqual({ ok: false, errors: { location: 'invalid' } })
  })
})

describe('property deletion', () => {
  it('is allowed when nothing refers to the property', () => {
    expect(checkPropertyDeletion('a', [{ propertyId: 'b' }], [])).toEqual({
      allowed: true,
      spaceCount: 0,
      maintenanceCount: 0,
    })
  })

  it('is blocked by spaces or maintenance tasks, with the counts', () => {
    const spaces = [{ propertyId: 'a' }, { propertyId: 'a' }, { propertyId: 'b' }]
    expect(checkPropertyDeletion('a', spaces, [{ propertyId: 'a' }])).toEqual({
      allowed: false,
      spaceCount: 2,
      maintenanceCount: 1,
    })
    expect(checkPropertyDeletion('b', [], [{ propertyId: 'b' }]).allowed).toBe(false)
  })
})
