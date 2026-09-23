import { isIsoDate, isRecord, readText, type IsoDate, type ParseResult } from '../domain/common.ts'
import { LEASE_STATUSES, MONTHLY_RENT_MAX_CENTS } from '../domain/leases.ts'
import { MAINTENANCE_CATEGORIES, MAINTENANCE_PRIORITIES, MAINTENANCE_STATUSES } from '../domain/maintenance.ts'
import { PROPERTY_TYPES } from '../domain/properties.ts'
import {
  SPACE_AREA_MAX,
  SPACE_FEATURES,
  SPACE_FLOOR_MAX,
  SPACE_FLOOR_MIN,
  SPACE_ROOMS_MAX,
  SPACE_ROOMS_MIN,
  SPACE_STATUSES,
  SPACE_TYPES,
} from '../domain/spaces.ts'
import { TENANT_TYPES } from '../domain/tenants.ts'

// "Ask JalaSpace": the model turns a question into a place to go or a search
// filter; it never sees the data. The frontend checks the answer again and
// runs the search itself (frontend/src/services/ask.ts). Change them together.

/** Longer questions are refused, which also keeps each request small for the free quota. */
export const ASK_QUESTION_MAX_LENGTH = 300
/** Text values in a filter, e.g. a city or part of a name. */
export const ASK_TEXT_MAX_LENGTH = 100
/** At most this many words of the question are reported as not understood. */
export const ASK_IGNORED_MAX = 5
export const ASK_IGNORED_MAX_LENGTH = 60

/** Where the app can take the user, with what the model needs to know to choose. */
export const PLACES = {
  dashboard: 'Dashboard: overview with statistics, recent maintenance, available spaces and recent activity',
  properties: 'The list of properties (buildings) with search',
  'properties.new': 'The form to add a property',
  spaces: 'The list of spaces (units, apartments, offices) with filters',
  'spaces.new': 'The form to add a space',
  tenants: 'The list of tenants with search',
  'tenants.new': 'The form to add a tenant',
  leases: 'The list of leases with filters',
  'leases.new': 'The form to add a lease (rent a space to a tenant)',
  maintenance: 'The list of maintenance tasks with filters',
  'maintenance.new': 'The form to add a maintenance task',
  'settings.profile': "Settings > Profile: the user's first and last name, birthdate and profile image",
  'settings.language': 'Settings > Language: switch between English and Finnish',
  'settings.demoData': 'Settings > Demo data: reset (restore) the demo data',
  apiDocs: 'The documentation of the JalaSpace REST API (OpenAPI, Swagger UI)',
} as const

export type Place = keyof typeof PLACES
export const PLACE_IDS = Object.keys(PLACES) as Place[]

export const AREAS = ['properties', 'spaces', 'tenants', 'leases', 'maintenance'] as const
export type Area = (typeof AREAS)[number]

/** How a filter field is matched; the frontend applies the same rules. */
export type FieldSpec = { description: string } & (
  | { kind: 'text' }
  /** Any of the values, or with `all`, every one of them. */
  | { kind: 'enum'; values: readonly string[]; all?: boolean }
  | { kind: 'range'; min: number; max: number; integer?: boolean }
  | { kind: 'dates' }
  | { kind: 'boolean' }
)

const text = (description: string): FieldSpec => ({ kind: 'text', description })
const anyOf = (values: readonly string[], description: string): FieldSpec => ({ kind: 'enum', values, description })
const range = (min: number, max: number, description: string, integer = false): FieldSpec => ({
  kind: 'range',
  min,
  max,
  integer,
  description,
})
const dates = (description: string): FieldSpec => ({ kind: 'dates', description })
const flag = (description: string): FieldSpec => ({ kind: 'boolean', description })

const RENT_MAX_EUR = MONTHLY_RENT_MAX_CENTS / 100
const COUNT_MAX = 100_000
const city = text('City in its base form, e.g. "Helsinki" for "Helsingissä"')
const added = dates('When the record was added')

/** Every field that can be filtered, per area. */
export const AREA_FIELDS: Record<Area, Record<string, FieldSpec>> = {
  properties: {
    text: text('Words to find in the name, address or description'),
    name: text('Part of the property name'),
    address: text('Part of the street address'),
    postalCode: text('Postal code or its beginning'),
    city,
    types: anyOf(PROPERTY_TYPES, 'Property types'),
    spaces: range(0, COUNT_MAX, 'Number of spaces in the property', true),
    occupancyPercent: range(0, 100, 'Occupied spaces as a percentage of all spaces'),
    openMaintenance: range(0, COUNT_MAX, 'Number of maintenance tasks that are not completed', true),
    added,
  },
  spaces: {
    text: text('Words to find in the space name'),
    name: text('Part of the space name, e.g. "A 11"'),
    property: text('Part of the name of the property the space is in'),
    city,
    types: anyOf(SPACE_TYPES, 'Space types; a flat or home is an apartment'),
    statuses: anyOf(SPACE_STATUSES, 'available = free to rent, occupied = rented, maintenance = out of use'),
    floor: range(SPACE_FLOOR_MIN, SPACE_FLOOR_MAX, 'Floor; 1 is the ground floor', true),
    areaM2: range(0, SPACE_AREA_MAX, 'Area in square metres'),
    rooms: range(SPACE_ROOMS_MIN, SPACE_ROOMS_MAX, 'Number of rooms; "kolmio" is 3, "kaksio" 2, "yksiö" 1', true),
    features: {
      kind: 'enum',
      values: SPACE_FEATURES,
      all: true,
      description: 'Features the space must all have',
    },
    reserved: flag('Whether the space has an upcoming lease'),
    tenant: text("Part of the current tenant's name"),
    monthlyRentEur: range(0, RENT_MAX_EUR, 'Monthly rent in euros under the active lease'),
    added,
  },
  tenants: {
    text: text('Words to find in the name, contact person, email, phone or notes'),
    types: anyOf(TENANT_TYPES, 'company or person'),
    name: text('Part of the tenant name'),
    contactPerson: text("Part of the contact person's name"),
    email: text('Part of the email address'),
    phone: text('Part of the phone number'),
    notes: text('Words in the notes'),
    leaseStatuses: anyOf(
      [...LEASE_STATUSES, 'none'],
      'Has a lease with one of these statuses; none = has no leases at all',
    ),
    property: text('Part of the name of a property where the tenant has an active or upcoming lease'),
    city: text('City where the tenant has an active or upcoming lease, in its base form'),
    added,
  },
  leases: {
    text: text('Words to find in the tenant, space or property name'),
    tenant: text('Part of the tenant name'),
    tenantTypes: anyOf(TENANT_TYPES, 'company or person'),
    space: text('Part of the space name'),
    spaceTypes: anyOf(SPACE_TYPES, 'Types of the leased space'),
    property: text('Part of the property name'),
    city,
    statuses: anyOf(LEASE_STATUSES, 'upcoming = starts later, active = in force today, ended'),
    startDate: dates('When the lease starts'),
    endDate: dates('When the lease ends; leases without an end date never match'),
    openEnded: flag('Whether the lease has no end date'),
    monthlyRentEur: range(0, RENT_MAX_EUR, 'Monthly rent in euros'),
    added,
  },
  maintenance: {
    text: text('Words to find in the title or description'),
    title: text('Part of the title'),
    description: text('Words in the description'),
    property: text('Part of the property name'),
    space: text('Part of the space name'),
    city,
    categories: anyOf(MAINTENANCE_CATEGORIES, 'plumbing, electrical, hvac (heating, ventilation), structural, cleaning, general'),
    priorities: anyOf(MAINTENANCE_PRIORITIES, 'Priorities'),
    statuses: anyOf(MAINTENANCE_STATUSES, '"Open tasks" means open and in_progress, i.e. not completed'),
    dueDate: dates('When the task is due'),
    overdue: flag('Whether the due date has passed and the task is not completed'),
    completedAt: dates('When the task was completed'),
    added,
  },
}

/** What each area's results can be sorted by. */
export const AREA_SORTS: Record<Area, readonly string[]> = {
  properties: ['name', 'city', 'spaces', 'occupancyPercent', 'openMaintenance', 'added'],
  spaces: ['name', 'property', 'floor', 'areaM2', 'rooms', 'monthlyRentEur', 'added'],
  tenants: ['name', 'type', 'added'],
  leases: ['startDate', 'endDate', 'monthlyRentEur', 'tenant', 'added'],
  maintenance: ['dueDate', 'priority', 'completedAt', 'title', 'added'],
}

export const SORT_DIRECTIONS = ['asc', 'desc'] as const

export type FilterValue = string | string[] | boolean | { min?: number; max?: number } | { from?: IsoDate; to?: IsoDate }

export type AskAnswer =
  | { kind: 'navigate'; place: Place }
  | {
      kind: 'search'
      area: Area
      /** Only the fields the question uses; an empty filter lists everything in the area. */
      filter: Record<string, FilterValue>
      sort?: { by: string; direction: (typeof SORT_DIRECTIONS)[number] }
      /** Words of the question that could not be used, e.g. "cheap"; always taken from the question. */
      ignored: string[]
    }
  | { kind: 'none' }

export interface AskRequest {
  question: string
  /** The user's calendar date, so "next month" means the same to the user and the search. */
  today: IsoDate
}

/** Why no answer could be given; returned to clients as the error code. */
export type AskErrorCode = 'ai_unavailable' | 'rate_limited' | 'invalid_answer'

export class AskError extends Error {
  readonly code: AskErrorCode

  constructor(code: AskErrorCode, message: string = code) {
    super(message)
    this.name = 'AskError'
    this.code = code
  }
}

/** Turns a question into an answer, e.g. with Gemini. */
export interface AskInterpreter {
  interpret(request: AskRequest): Promise<AskAnswer>
}

/** Checks a request body: a question and the user's date. */
export function parseAskRequest(body: unknown): ParseResult<AskRequest> {
  const source = isRecord(body) ? body : {}
  const errors: Partial<Record<keyof AskRequest, 'required' | 'tooLong' | 'invalid'>> = {}

  const question = readText(source, 'question')?.replace(/\s+/g, ' ')
  if (question === undefined) errors.question = 'invalid'
  else if (!question) errors.question = 'required'
  else if (question.length > ASK_QUESTION_MAX_LENGTH) errors.question = 'tooLong'

  const today = source.today
  if (today === undefined || today === null || today === '') errors.today = 'required'
  else if (typeof today !== 'string' || !isIsoDate(today)) errors.today = 'invalid'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, values: { question: question!, today: today as IsoDate } }
}

const invalid = (message: string) => new AskError('invalid_answer', message)

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  (isRecord(value) && Object.values(value).every((part) => part === undefined || part === null))

/** Checks one filter value against its field; throws on anything the field does not allow. */
function parseFieldValue(field: string, spec: FieldSpec, value: unknown): FilterValue {
  switch (spec.kind) {
    case 'text': {
      if (typeof value !== 'string') throw invalid(`${field} is not text`)
      const trimmed = value.trim().replace(/\s+/g, ' ')
      if (trimmed.length > ASK_TEXT_MAX_LENGTH) throw invalid(`${field} is too long`)
      return trimmed
    }
    case 'enum': {
      if (!Array.isArray(value) || !value.every((item) => spec.values.includes(item as string))) {
        throw invalid(`${field} has an unknown value`)
      }
      return spec.values.filter((item) => value.includes(item))
    }
    case 'range': {
      if (!isRecord(value)) throw invalid(`${field} is not a range`)
      const result: { min?: number; max?: number } = {}
      for (const bound of ['min', 'max'] as const) {
        const number = value[bound]
        if (number === undefined || number === null) continue
        if (
          typeof number !== 'number' ||
          !Number.isFinite(number) ||
          number < spec.min ||
          number > spec.max ||
          (spec.integer && !Number.isInteger(number))
        ) {
          throw invalid(`${field}.${bound} is out of range`)
        }
        result[bound] = number
      }
      if (result.min !== undefined && result.max !== undefined && result.min > result.max) {
        throw invalid(`${field} has min above max`)
      }
      return result
    }
    case 'dates': {
      if (!isRecord(value)) throw invalid(`${field} is not a date range`)
      const result: { from?: IsoDate; to?: IsoDate } = {}
      for (const bound of ['from', 'to'] as const) {
        const date = value[bound]
        if (date === undefined || date === null) continue
        if (typeof date !== 'string' || !isIsoDate(date)) throw invalid(`${field}.${bound} is not a date`)
        result[bound] = date
      }
      if (result.from && result.to && result.from > result.to) throw invalid(`${field} ends before it starts`)
      return result
    }
    case 'boolean':
      if (typeof value !== 'boolean') throw invalid(`${field} is not a boolean`)
      return value
  }
}

/** Only words of the question, so the answer can never show text the model made up. */
function parseIgnored(value: unknown, question: string): string[] {
  if (!Array.isArray(value)) return []
  const lowerQuestion = question.toLowerCase()
  const words = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().replace(/\s+/g, ' '))
    .filter((item) => item && item.length <= ASK_IGNORED_MAX_LENGTH && lowerQuestion.includes(item.toLowerCase()))
  const unique = words.filter(
    (word, index) => words.findIndex((other) => other.toLowerCase() === word.toLowerCase()) === index,
  )
  return unique.slice(0, ASK_IGNORED_MAX)
}

/**
 * Checks what the model returned. Its output is never trusted: an unknown
 * place, area, field or value, or a value out of range, rejects the whole
 * answer rather than searching with part of the question.
 *
 * The model answers in a flat shape (see `geminiAsk.ts`): `kind`, `place`,
 * `area`, one filter object per area, `sortBy`, `sortDirection` and `ignored`.
 */
export function parseAskAnswer(value: unknown, question: string): AskAnswer {
  if (!isRecord(value)) throw invalid('The answer is not an object')

  if (value.kind === 'none') return { kind: 'none' }

  if (value.kind === 'navigate') {
    if (!PLACE_IDS.includes(value.place as Place)) throw invalid('Unknown place')
    return { kind: 'navigate', place: value.place as Place }
  }

  if (value.kind !== 'search') throw invalid('Unknown kind')
  if (!AREAS.includes(value.area as Area)) throw invalid('Unknown area')
  const area = value.area as Area
  const fields = AREA_FIELDS[area]

  // Filters for other areas are ignored; only the chosen area's filter is used.
  const source = value[area] ?? {}
  if (!isRecord(source)) throw invalid('The filter is not an object')
  const filter: Record<string, FilterValue> = {}
  for (const [field, fieldValue] of Object.entries(source)) {
    if (isEmpty(fieldValue)) continue
    const spec = fields[field]
    if (!spec) throw invalid(`Unknown field ${area}.${field}`)
    const parsed = parseFieldValue(field, spec, fieldValue)
    if (!isEmpty(parsed)) filter[field] = parsed
  }

  let sort: { by: string; direction: 'asc' | 'desc' } | undefined
  if (!isEmpty(value.sortBy)) {
    if (!AREA_SORTS[area].includes(value.sortBy as string)) throw invalid(`Unknown sort ${String(value.sortBy)}`)
    const direction = value.sortDirection ?? 'asc'
    if (!SORT_DIRECTIONS.includes(direction as 'asc')) throw invalid('Unknown sort direction')
    sort = { by: value.sortBy as string, direction: direction as 'asc' | 'desc' }
  }

  return {
    kind: 'search',
    area,
    filter,
    ...(sort ? { sort } : {}),
    ignored: parseIgnored(value.ignored, question),
  }
}
