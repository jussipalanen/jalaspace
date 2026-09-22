import type { IsoDate } from '../types/common'

/** Formats a Date as a date-only ISO string using the local calendar date. */
export function toIsoDate(date: Date): IsoDate {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** Adds calendar months, clamping to the last day of shorter months (31.1. + 1 month = 28.2.). */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  const day = result.getDate()
  result.setDate(1)
  result.setMonth(result.getMonth() + months)
  const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
  result.setDate(Math.min(day, lastDayOfMonth))
  return result
}

function fromUtc(date: Date): IsoDate {
  return date.toISOString().slice(0, 10)
}

function toUtc(value: IsoDate): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day!))
}

/**
 * Moves a date-only value by days or calendar months. Months clamp to the
 * last day of shorter months (31.1. + 1 month = 28.2.). Works in UTC, so
 * daylight saving time cannot shift the day.
 */
export function shiftIsoDate(value: IsoDate, { days = 0, months = 0 }: { days?: number; months?: number }): IsoDate {
  const date = toUtc(value)
  if (months) {
    const day = date.getUTCDate()
    date.setUTCDate(1)
    date.setUTCMonth(date.getUTCMonth() + months)
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
    date.setUTCDate(Math.min(day, lastDay))
  }
  date.setUTCDate(date.getUTCDate() + days)
  return fromUtc(date)
}

/** Day of the week with Monday as 0 and Sunday as 6. */
export function isoWeekday(value: IsoDate): number {
  return (toUtc(value).getUTCDay() + 6) % 7
}

/**
 * The weeks shown in a month calendar for the month of `value`: full weeks
 * from Monday to Sunday, including days of the neighbouring months.
 */
export function calendarWeeks(value: IsoDate): IsoDate[][] {
  const first = `${value.slice(0, 7)}-01`
  let day = shiftIsoDate(first, { days: -isoWeekday(first) })
  const weeks: IsoDate[][] = []
  do {
    const week: IsoDate[] = []
    for (let i = 0; i < 7; i++) {
      week.push(day)
      day = shiftIsoDate(day, { days: 1 })
    }
    weeks.push(week)
  } while (day.slice(0, 7) === value.slice(0, 7))
  return weeks
}

/** True for a real calendar date written as a date-only ISO string (`2026-09-30`). */
export function isIsoDate(value: string): value is IsoDate {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && shiftIsoDate(value, {}) === value
}

/**
 * Parses a date typed as `d.m.yyyy` (e.g. `30.9.2026`) into a date-only ISO
 * string, or `null` if it is not a real calendar date. No timestamps are
 * involved, so no timezone can shift the day.
 */
export function parseDisplayDate(value: string): IsoDate | null {
  const parts = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value.trim())
  if (!parts) return null
  const [, dayText, monthText, yearText] = parts
  const day = Number(dayText)
  const month = Number(monthText)
  const year = Number(yearText)
  if (year < 1 || month < 1 || month > 12) return null
  // Day 0 of the next month is the last day of this month.
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (day < 1 || day > daysInMonth) return null
  return `${yearText}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
