import { describe, expect, it } from 'vitest'
import { formatArea, formatCount, formatDate } from './format'

describe('format helpers', () => {
  it('formats date-only values as d.m.yyyy without timezone shifts', () => {
    expect(formatDate('2026-09-02')).toBe('2.9.2026')
    expect(formatDate('2026-12-31')).toBe('31.12.2026')
  })

  it('formats timestamps using the local calendar date', () => {
    const local = new Date(2026, 8, 22, 23, 30)
    expect(formatDate(local.toISOString())).toBe('22.9.2026')
  })

  it('formats areas and counts', () => {
    expect(formatArea(62)).toBe('62 m²')
    expect(formatCount(1, 'space')).toBe('1 space')
    expect(formatCount(4, 'city', 'cities')).toBe('4 cities')
  })
})
