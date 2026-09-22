import { describe, expect, it } from 'vitest'
import { addDays, addMonths, toIsoDate } from './date'

describe('date utilities', () => {
  it('formats the local calendar date as a date-only ISO string', () => {
    expect(toIsoDate(new Date(2026, 8, 2, 23, 59))).toBe('2026-09-02')
  })

  it('adds and subtracts days across month and year boundaries', () => {
    expect(toIsoDate(addDays(new Date(2026, 11, 31), 1))).toBe('2027-01-01')
    expect(toIsoDate(addDays(new Date(2026, 2, 1), -1))).toBe('2026-02-28')
  })

  it('adds months, clamping to the end of shorter months', () => {
    expect(toIsoDate(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-28')
    expect(toIsoDate(addMonths(new Date(2028, 0, 31), 1))).toBe('2028-02-29')
    expect(toIsoDate(addMonths(new Date(2026, 9, 15), -12))).toBe('2025-10-15')
  })

  it('does not mutate the input date', () => {
    const date = new Date(2026, 8, 22)
    addDays(date, 5)
    addMonths(date, 5)
    expect(toIsoDate(date)).toBe('2026-09-22')
  })
})
