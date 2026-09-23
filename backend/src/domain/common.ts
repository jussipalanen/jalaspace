/** ISO 8601 timestamp, e.g. `2026-09-22T10:30:00.000Z`. */
export type IsoDateTime = string

/** Fields shared by every stored domain entity; the server sets them. */
export interface Entity {
  id: string
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

/**
 * Error code for one invalid field. The frontend translates it per field.
 * `notFound`, `duplicate` and `maintenanceLinked` compare the input with the
 * stored data, e.g. a space's property must exist.
 */
export type FieldErrorCode = 'required' | 'tooLong' | 'invalid' | 'notFound' | 'duplicate' | 'maintenanceLinked'

/** The result of checking a request body: the cleaned values, or an error code per field. */
export type ParseResult<T> =
  | { ok: true; values: T }
  | { ok: false; errors: Partial<Record<keyof T, FieldErrorCode>> }

/**
 * Reads an optional text field: missing or `null` becomes `''`, anything
 * other than a string is `undefined` (invalid). The result is trimmed.
 */
export function readText(body: Record<string, unknown>, field: string): string | undefined {
  const value = body[field]
  if (value === undefined || value === null) return ''
  return typeof value === 'string' ? value.trim() : undefined
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
