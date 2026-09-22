import { describe, expect, it } from 'vitest'
import { formatDate } from './format'

describe('formatDate', () => {
  it('formats date-only values as d.m.yyyy without timezone shifts', () => {
    expect(formatDate('2026-09-02')).toBe('2.9.2026')
    expect(formatDate('2026-12-31')).toBe('31.12.2026')
  })

  it('formats timestamps using the local calendar date', () => {
    const local = new Date(2026, 8, 22, 23, 30)
    expect(formatDate(local.toISOString())).toBe('22.9.2026')
  })
})
