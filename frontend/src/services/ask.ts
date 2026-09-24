import { LEASE_STATUSES, MONTHLY_RENT_MAX_EUROS } from './leases'
import { MAINTENANCE_CATEGORIES, MAINTENANCE_PRIORITIES, MAINTENANCE_STATUSES } from './maintenance'
import { PROPERTY_TYPES } from './properties'
import {
  SPACE_AREA_MAX,
  SPACE_FEATURES,
  SPACE_FLOOR_MAX,
  SPACE_FLOOR_MIN,
  SPACE_ROOMS_MAX,
  SPACE_ROOMS_MIN,
  SPACE_STATUSES,
  SPACE_TYPES,
} from './spaces'
import { TENANT_TYPES } from './tenants'
import type { IsoDate } from '../types/common'
import { isIsoDate } from '../utils/date'

// "Ask JalaSpace": the API turns a question into a place to go or a search
// filter; the app searches its own data with the filter (see askSearch.ts).
// The rules match the API (backend/src/ai/ask.ts). Change them together.

export const ASK_QUESTION_MAX_LENGTH = 300
const TEXT_MAX_LENGTH = 100
const IGNORED_MAX = 5
const IGNORED_MAX_LENGTH = 60

/** The Render free plan can take up to a minute to wake up, so wait that long. */
const TIMEOUT_MS = 60_000

/** Where an answer can take the user; `apiDocs` opens the API's own documentation. */
export const PLACE_PATHS = {
  dashboard: '/',
  properties: '/properties',
  'properties.new': '/properties/new',
  spaces: '/units',
  'spaces.new': '/units/new',
  tenants: '/tenants',
  'tenants.new': '/tenants/new',
  leases: '/leases',
  'leases.new': '/leases/new',
  maintenance: '/maintenance',
  'maintenance.new': '/maintenance/new',
  'settings.profile': '/settings#profile',
  'settings.language': '/settings#language',
  'settings.demoData': '/settings#demo-data',
  apiDocs: '/docs',
} as const

export type Place = keyof typeof PLACE_PATHS

export const AREAS = ['properties', 'spaces', 'tenants', 'leases', 'maintenance'] as const
export type Area = (typeof AREAS)[number]

/** How a filter field is matched. */
export type FieldSpec =
  | { kind: 'text' }
  /** Any of the values, or with `all`, every one of them. */
  | { kind: 'enum'; values: readonly string[]; all?: boolean }
  | { kind: 'range'; min: number; max: number; integer?: boolean }
  | { kind: 'dates' }
  | { kind: 'boolean' }

const text = { kind: 'text' } as const
const anyOf = (values: readonly string[]) => ({ kind: 'enum', values }) as const
const range = (min: number, max: number, integer = false) => ({ kind: 'range', min, max, integer }) as const
const dates = { kind: 'dates' } as const
const flag = { kind: 'boolean' } as const
const COUNT_MAX = 100_000

export const PROPERTY_FIELDS = {
  text,
  name: text,
  address: text,
  postalCode: text,
  city: text,
  types: anyOf(PROPERTY_TYPES),
  spaces: range(0, COUNT_MAX, true),
  occupancyPercent: range(0, 100),
  openMaintenance: range(0, COUNT_MAX, true),
  added: dates,
} satisfies Record<string, FieldSpec>

export const SPACE_FIELDS = {
  text,
  name: text,
  property: text,
  city: text,
  types: anyOf(SPACE_TYPES),
  statuses: anyOf(SPACE_STATUSES),
  floor: range(SPACE_FLOOR_MIN, SPACE_FLOOR_MAX, true),
  areaM2: range(0, SPACE_AREA_MAX),
  rooms: range(SPACE_ROOMS_MIN, SPACE_ROOMS_MAX, true),
  features: { kind: 'enum', values: SPACE_FEATURES, all: true },
  reserved: flag,
  tenant: text,
  monthlyRentEur: range(0, MONTHLY_RENT_MAX_EUROS),
  added: dates,
} satisfies Record<string, FieldSpec>

/** A tenant without any lease matches the lease status `none`. */
export const TENANT_LEASE_STATUSES = [...LEASE_STATUSES, 'none'] as const

export const TENANT_FIELDS = {
  text,
  types: anyOf(TENANT_TYPES),
  name: text,
  contactPerson: text,
  email: text,
  phone: text,
  notes: text,
  leaseStatuses: anyOf(TENANT_LEASE_STATUSES),
  property: text,
  city: text,
  added: dates,
} satisfies Record<string, FieldSpec>

export const LEASE_FIELDS = {
  text,
  tenant: text,
  tenantTypes: anyOf(TENANT_TYPES),
  space: text,
  spaceTypes: anyOf(SPACE_TYPES),
  property: text,
  city: text,
  statuses: anyOf(LEASE_STATUSES),
  startDate: dates,
  endDate: dates,
  openEnded: flag,
  monthlyRentEur: range(0, MONTHLY_RENT_MAX_EUROS),
  added: dates,
} satisfies Record<string, FieldSpec>

export const MAINTENANCE_FIELDS = {
  text,
  title: text,
  description: text,
  property: text,
  space: text,
  city: text,
  categories: anyOf(MAINTENANCE_CATEGORIES),
  priorities: anyOf(MAINTENANCE_PRIORITIES),
  statuses: anyOf(MAINTENANCE_STATUSES),
  dueDate: dates,
  overdue: flag,
  completedAt: dates,
  added: dates,
} satisfies Record<string, FieldSpec>

export const AREA_FIELDS: Record<Area, Record<string, FieldSpec>> = {
  properties: PROPERTY_FIELDS,
  spaces: SPACE_FIELDS,
  tenants: TENANT_FIELDS,
  leases: LEASE_FIELDS,
  maintenance: MAINTENANCE_FIELDS,
}

export const AREA_SORTS = {
  properties: ['name', 'city', 'spaces', 'occupancyPercent', 'openMaintenance', 'added'],
  spaces: ['name', 'property', 'floor', 'areaM2', 'rooms', 'monthlyRentEur', 'added'],
  tenants: ['name', 'type', 'added'],
  leases: ['startDate', 'endDate', 'monthlyRentEur', 'tenant', 'added'],
  maintenance: ['dueDate', 'priority', 'completedAt', 'title', 'added'],
} as const satisfies Record<Area, readonly string[]>

export interface NumberRange {
  min?: number
  max?: number
}

export interface DateRange {
  from?: IsoDate
  to?: IsoDate
}

export type FilterValue = string | string[] | boolean | NumberRange | DateRange

export interface AskSort {
  by: string
  direction: 'asc' | 'desc'
}

export interface AskSearch {
  kind: 'search'
  area: Area
  /** Only the fields the question uses; empty lists everything in the area. */
  filter: Record<string, FilterValue>
  sort?: AskSort
  /** Words of the question that could not be used, e.g. "cheap". */
  ignored: string[]
}

export type AskAnswer = { kind: 'navigate'; place: Place } | AskSearch | { kind: 'none' }

/** Why no answer is available; the UI translates it (`dashboard.ask.errors.<code>`). */
export type AskErrorCode = 'required' | 'tooLong' | 'unavailable' | 'rateLimited' | 'invalidAnswer' | 'network'

export class AskRequestError extends Error {
  readonly code: AskErrorCode

  constructor(code: AskErrorCode) {
    super(code)
    this.name = 'AskRequestError'
    this.code = code
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const invalid = () => new AskRequestError('invalidAnswer')

function checkValue(spec: FieldSpec, value: unknown): FilterValue {
  switch (spec.kind) {
    case 'text':
      if (typeof value !== 'string' || !value.trim() || value.length > TEXT_MAX_LENGTH) throw invalid()
      return value.trim()
    case 'enum':
      if (!Array.isArray(value) || value.length === 0 || !value.every((item) => spec.values.includes(item as string))) {
        throw invalid()
      }
      return spec.values.filter((item) => value.includes(item))
    case 'range': {
      if (!isRecord(value)) throw invalid()
      const result: NumberRange = {}
      for (const bound of ['min', 'max'] as const) {
        const number = value[bound]
        if (number === undefined) continue
        if (
          typeof number !== 'number' ||
          !Number.isFinite(number) ||
          number < spec.min ||
          number > spec.max ||
          (spec.integer && !Number.isInteger(number))
        ) {
          throw invalid()
        }
        result[bound] = number
      }
      if (result.min === undefined && result.max === undefined) throw invalid()
      if (result.min !== undefined && result.max !== undefined && result.min > result.max) throw invalid()
      return result
    }
    case 'dates': {
      if (!isRecord(value)) throw invalid()
      const result: DateRange = {}
      for (const bound of ['from', 'to'] as const) {
        const date = value[bound]
        if (date === undefined) continue
        if (typeof date !== 'string' || !isIsoDate(date)) throw invalid()
        result[bound] = date
      }
      if (!result.from && !result.to) throw invalid()
      if (result.from && result.to && result.from > result.to) throw invalid()
      return result
    }
    case 'boolean':
      if (typeof value !== 'boolean') throw invalid()
      return value
  }
}

/**
 * Checks the API's answer again: only known places, areas, fields and values
 * reach the UI, and ignored words must come from the question.
 */
export function parseAskAnswer(body: unknown, question: string): AskAnswer {
  if (!isRecord(body)) throw invalid()
  if (body.kind === 'none') return { kind: 'none' }
  if (body.kind === 'navigate') {
    if (typeof body.place !== 'string' || !Object.hasOwn(PLACE_PATHS, body.place)) throw invalid()
    return { kind: 'navigate', place: body.place as Place }
  }
  if (body.kind !== 'search' || !AREAS.includes(body.area as Area) || !isRecord(body.filter)) throw invalid()

  const area = body.area as Area
  const fields = AREA_FIELDS[area]
  const filter: Record<string, FilterValue> = {}
  for (const [field, value] of Object.entries(body.filter)) {
    if (!Object.hasOwn(fields, field)) throw invalid()
    filter[field] = checkValue(fields[field]!, value)
  }

  let sort: AskSort | undefined
  if (body.sort !== undefined) {
    const { by, direction } = isRecord(body.sort) ? body.sort : {}
    if (!(AREA_SORTS[area] as readonly unknown[]).includes(by) || (direction !== 'asc' && direction !== 'desc')) {
      throw invalid()
    }
    sort = { by: by as string, direction }
  }

  const lowerQuestion = question.toLowerCase()
  const ignored = Array.isArray(body.ignored)
    ? body.ignored
        .filter(
          (word): word is string =>
            typeof word === 'string' &&
            word.length > 0 &&
            word.length <= IGNORED_MAX_LENGTH &&
            lowerQuestion.includes(word.toLowerCase()),
        )
        .slice(0, IGNORED_MAX)
    : []

  return { kind: 'search', area, filter, ...(sort ? { sort } : {}), ignored }
}

function withTimeout(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}

function errorCodeFor(status: number, body: unknown): AskErrorCode {
  const code = (body as { error?: { code?: unknown } } | null)?.error?.code
  if (code === 'validation_failed') return 'required'
  if (code === 'rate_limited' || status === 429) return 'rateLimited'
  if (code === 'invalid_answer') return 'invalidAnswer'
  return 'unavailable'
}

/**
 * Sends the question and the user's date to the API and returns the checked
 * answer. The question goes to the AI provider; the app's data does not.
 */
export async function requestAskAnswer(
  apiUrl: string,
  question: string,
  today: IsoDate,
  signal?: AbortSignal,
): Promise<AskAnswer> {
  const trimmed = question.trim().replace(/\s+/g, ' ')
  if (!trimmed) throw new AskRequestError('required')
  if (trimmed.length > ASK_QUESTION_MAX_LENGTH) throw new AskRequestError('tooLong')

  let response: Response
  try {
    response = await fetch(`${apiUrl}/api/ask`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: trimmed, today }),
      signal: withTimeout(signal),
    })
  } catch (error) {
    // Cancelled by the caller (e.g. a new question): not an error to show.
    if (signal?.aborted) throw error
    throw new AskRequestError('network')
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new AskRequestError(errorCodeFor(response.status, body))
  return parseAskAnswer(body, trimmed)
}
