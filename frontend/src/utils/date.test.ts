import { describe, expect, it } from 'vitest'
import { addDays, addMonths, calendarWeeks, isoWeekday, shiftIsoDate, toIsoDate } from './date'

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

describe('calendar helpers', () => {
  it('shifts date-only values by days and months', () => {
    expect(shiftIsoDate('2026-09-30', { days: 1 })).toBe('2026-10-01')
    expect(shiftIsoDate('2026-01-01', { days: -1 })).toBe('2025-12-31')
    expect(shiftIsoDate('2026-03-29', { days: 1 })).toBe('2026-03-30')
    expect(shiftIsoDate('2026-01-31', { months: 1 })).toBe('2026-02-28')
    expect(shiftIsoDate('2028-03-31', { months: -1 })).toBe('2028-02-29')
    expect(shiftIsoDate('2026-12-15', { months: 1 })).toBe('2027-01-15')
  })

  it('numbers weekdays from Monday', () => {
    expect(isoWeekday('2026-09-21')).toBe(0)
    expect(isoWeekday('2026-09-27')).toBe(6)
  })

  it('lists full Monday-to-Sunday weeks covering the month', () => {
    const weeks = calendarWeeks('2026-09-22')
    expect(weeks).toHaveLength(5)
    expect(weeks[0]![0]).toBe('2026-08-31')
    expect(weeks.at(-1)!.at(-1)).toBe('2026-10-04')
    expect(weeks.every((week) => week.length === 7)).toBe(true)
    // February 2021 starts on a Monday and fits exactly four weeks.
    expect(calendarWeeks('2021-02-10')).toHaveLength(4)
  })
})
