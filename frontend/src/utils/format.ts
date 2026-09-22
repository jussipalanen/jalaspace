import type { IsoDate, IsoDateTime } from '../types/common'

/**
 * Formats a date-only (`2026-09-22`) or timestamp value as `d.m.yyyy`
 * (22.9.2026) in every language. Timestamps use the viewer's local calendar date.
 */
export function formatDate(value: IsoDate | IsoDateTime): string {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    return `${Number(day)}.${Number(month)}.${year}`
  }
  const date = new Date(value)
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
}
