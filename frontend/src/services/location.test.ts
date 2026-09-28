import { describe, expect, it } from 'vitest'
import { formatCoordinate, isSameLocation, parseCoordinate, roundLocation } from './location'

describe('parseCoordinate', () => {
  it('parses degrees with a decimal point or a decimal comma', () => {
    expect(parseCoordinate('62.601300', 'latitude')).toBe(62.601300)
    expect(parseCoordinate(' 29,763600 ', 'longitude')).toBe(29.763600)
    expect(parseCoordinate('-33', 'latitude')).toBe(-33)
    expect(parseCoordinate('+.5', 'longitude')).toBe(0.5)
  })

  it('rounds to 6 decimals', () => {
    expect(parseCoordinate('62.60130049', 'latitude')).toBe(62.601300)
  })

  it('accepts the limits and rejects values outside them', () => {
    expect(parseCoordinate('90', 'latitude')).toBe(90)
    expect(parseCoordinate('-180', 'longitude')).toBe(-180)
    expect(parseCoordinate('90.000001', 'latitude')).toBeNull()
    expect(parseCoordinate('180.5', 'longitude')).toBeNull()
  })

  it.each(['', ' ', 'north', '62.6.1', '1e2', '62°', 'Infinity', '0x10'])('rejects "%s"', (text) => {
    expect(parseCoordinate(text, 'latitude')).toBeNull()
  })
})

describe('formatting and comparing locations', () => {
  it('formats with a decimal point and at most 6 decimals', () => {
    expect(formatCoordinate(62.60131249)).toBe('62.601312')
    expect(formatCoordinate(62.6013)).toBe('62.6013')
    expect(formatCoordinate(-33)).toBe('-33')
  })

  it('rounds both coordinates', () => {
    expect(roundLocation({ latitude: 1.23456789, longitude: -9.87654321 })).toEqual({
      latitude: 1.234568,
      longitude: -9.876543,
    })
  })

  it('compares at the stored precision', () => {
    const a = { latitude: 62.601300, longitude: 29.763600 }
    expect(isSameLocation(a, { latitude: 62.6013001, longitude: 29.7635999 })).toBe(true)
    expect(isSameLocation(a, { latitude: 62.60158, longitude: 29.763600 })).toBe(false)
    expect(isSameLocation(a, null)).toBe(false)
    expect(isSameLocation(null, null)).toBe(true)
  })
})
