import {
  AREA_FIELDS,
  AREA_SORTS,
  AREAS,
  ASK_IGNORED_MAX,
  ASK_QUESTION_MAX_LENGTH,
  ASK_TEXT_MAX_LENGTH,
  PLACE_IDS,
  SORT_DIRECTIONS,
  type FieldSpec,
} from '../ai/ask.ts'
import { LANGUAGES, SUGGESTION_DESCRIPTION_MAX_LENGTH } from '../ai/suggestions.ts'
import { FIELD_ERROR_CODES } from '../domain/common.ts'
import { MONTHLY_RENT_MAX_CENTS } from '../domain/leases.ts'
import {
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_DESCRIPTION_MAX_LENGTH,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  MAINTENANCE_TITLE_MAX_LENGTH,
} from '../domain/maintenance.ts'
import {
  COORDINATE_DECIMALS,
  DEFAULT_MAP_ZOOM,
  LATITUDE_MAX,
  LATITUDE_MIN,
  LONGITUDE_MAX,
  LONGITUDE_MIN,
  MAP_ZOOM_MAX,
  MAP_ZOOM_MIN,
  POSTAL_CODE_PATTERN,
  PROPERTY_DESCRIPTION_MAX_LENGTH,
  PROPERTY_NAME_MAX_LENGTH,
  PROPERTY_TYPES,
} from '../domain/properties.ts'
import {
  SPACE_AREA_MAX,
  SPACE_FEATURES,
  SPACE_FLOOR_MAX,
  SPACE_FLOOR_MIN,
  SPACE_NAME_MAX_LENGTH,
  SPACE_ROOMS_MAX,
  SPACE_ROOMS_MIN,
  SPACE_STATUSES,
  SPACE_TYPES,
} from '../domain/spaces.ts'
import {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  TENANT_CONTACT_MAX_LENGTH,
  TENANT_EMAIL_MAX_LENGTH,
  TENANT_NAME_MAX_LENGTH,
  TENANT_NOTES_MAX_LENGTH,
  TENANT_PHONE_MAX_LENGTH,
  TENANT_PHONE_MIN_LENGTH,
  TENANT_TYPES,
} from '../domain/tenants.ts'
import { ERROR_CODES } from '../errors.ts'

// JSON Schemas (OpenAPI 3.1) for the API, built from the same constants the
// validators in src/domain use, so allowed values, lengths and ranges cannot
// drift from the code.

export type Schema = Record<string, unknown>

const text = (maxLength: number, extra: Schema = {}): Schema => ({ type: 'string', maxLength, ...extra })
const requiredText = (maxLength?: number, extra: Schema = {}): Schema => ({
  type: 'string',
  minLength: 1,
  ...(maxLength === undefined ? {} : { maxLength }),
  ...extra,
})
const oneOf = (values: readonly string[], description?: string): Schema => ({
  type: 'string',
  enum: [...values],
  ...(description ? { description } : {}),
})
const nullable = (schema: Schema): Schema => ({ ...schema, type: [schema.type as string, 'null'] })
const id = (description: string, example?: string): Schema => ({
  type: 'string',
  minLength: 1,
  description,
  ...(example ? { example } : {}),
})
const date = (description: string, example = '2026-10-01'): Schema => ({ type: 'string', format: 'date', description, example })

/** An object schema; `required` lists the fields a client must send. */
function object(properties: Record<string, Schema>, required: string[], description?: string): Schema {
  return { type: 'object', ...(description ? { description } : {}), properties, required }
}

const ENTITY_FIELDS: Record<string, Schema> = {
  id: {
    type: 'string',
    description: 'Assigned by the server: a UUID, or a readable id in the demo data.',
    example: '2f46a796-8488-470f-ac25-35fac8ea31da',
  },
  createdAt: { type: 'string', format: 'date-time', readOnly: true },
  updatedAt: { type: 'string', format: 'date-time', readOnly: true },
}

/**
 * A stored entity: the input fields (all present in responses), the server's
 * id and timestamps, and any fields only the server sets.
 */
function entity(input: Schema, serverFields: Record<string, Schema> = {}, description?: string): Schema {
  const properties = { ...ENTITY_FIELDS, ...(input.properties as Record<string, Schema>), ...serverFields }
  return object(properties, Object.keys(properties), description)
}

const propertyInput = object(
  {
    name: requiredText(PROPERTY_NAME_MAX_LENGTH, { example: 'Joensuu Center' }),
    type: oneOf(PROPERTY_TYPES),
    address: requiredText(undefined, { example: 'Siltakatu 12' }),
    postalCode: { type: 'string', pattern: POSTAL_CODE_PATTERN.source, example: '80100' },
    city: requiredText(undefined, { example: 'Joensuu' }),
    description: text(PROPERTY_DESCRIPTION_MAX_LENGTH, { description: 'Optional; empty when missing.' }),
    location: {
      type: ['object', 'null'],
      description: `Optional; \`null\` when missing. WGS 84 degrees, as on OpenStreetMap, rounded to ${COORDINATE_DECIMALS} decimals.`,
      properties: {
        latitude: { type: 'number', minimum: LATITUDE_MIN, maximum: LATITUDE_MAX, example: 62.601579 },
        longitude: { type: 'number', minimum: LONGITUDE_MIN, maximum: LONGITUDE_MAX, example: 29.762079 },
        zoom: {
          type: 'integer',
          minimum: MAP_ZOOM_MIN,
          maximum: MAP_ZOOM_MAX,
          default: DEFAULT_MAP_ZOOM,
          description: `Zoom level the map shows the location at; ${DEFAULT_MAP_ZOOM} when missing.`,
          example: 17,
        },
      },
      required: ['latitude', 'longitude'],
    },
  },
  ['name', 'type', 'address', 'postalCode', 'city'],
  'Text fields are trimmed.',
)

const spaceInput = object(
  {
    propertyId: id('The property the space belongs to; it must exist (`notFound`).', 'property-joensuu-center'),
    name: requiredText(SPACE_NAME_MAX_LENGTH, {
      description: 'Unique within the property, ignoring case (`duplicate`).',
      example: 'A 201',
    }),
    type: oneOf(SPACE_TYPES),
    floor: { type: 'integer', minimum: SPACE_FLOOR_MIN, maximum: SPACE_FLOOR_MAX, example: 2 },
    areaM2: {
      type: 'number',
      exclusiveMinimum: 0,
      maximum: SPACE_AREA_MAX,
      multipleOf: 0.01,
      description: 'Area in square metres, at most two decimals.',
      example: 62.5,
    },
    rooms: {
      type: ['integer', 'null'],
      minimum: SPACE_ROOMS_MIN,
      maximum: SPACE_ROOMS_MAX,
      description: 'Optional number of rooms; `null` when missing.',
      example: 3,
    },
    features: {
      type: 'array',
      items: oneOf(SPACE_FEATURES),
      uniqueItems: true,
      description: 'Optional; empty when missing. Duplicates are removed and the features are stored in the listed order.',
      example: ['sauna', 'balcony'],
    },
    status: oneOf(
      SPACE_STATUSES,
      'Follows the leases: a space is occupied exactly when it has an active lease. `occupied` sent for a space without one is saved as `available`, and a space with an active lease stays occupied.',
    ),
  },
  ['propertyId', 'name', 'type', 'floor', 'areaM2', 'status'],
  'A space with maintenance tasks cannot move to another property (`propertyId`: `maintenanceLinked`).',
)

const maintenanceInput = object(
  {
    propertyId: id('The property the task concerns; it must exist (`notFound`).', 'property-joensuu-center'),
    spaceId: nullable({
      ...id('A space of that property (`invalid` otherwise), or `null` for the whole property or a common area.'),
    }),
    title: requiredText(MAINTENANCE_TITLE_MAX_LENGTH, { example: 'Main entrance door closer broken' }),
    description: text(MAINTENANCE_DESCRIPTION_MAX_LENGTH, { description: 'Optional; empty when missing.' }),
    category: oneOf(MAINTENANCE_CATEGORIES),
    priority: oneOf(MAINTENANCE_PRIORITIES),
    status: oneOf(MAINTENANCE_STATUSES, 'A status change is an ordinary update.'),
    dueDate: nullable(date('Optional; past dates are allowed.')),
  },
  ['propertyId', 'title', 'category', 'priority', 'status'],
)

const tenantInput = object(
  {
    type: oneOf(TENANT_TYPES),
    name: requiredText(TENANT_NAME_MAX_LENGTH, { example: 'Nordic Pixel Oy' }),
    contactPerson: nullable(
      text(TENANT_CONTACT_MAX_LENGTH, { description: 'Only companies have one; `null` for people and when empty.' }),
    ),
    email: {
      type: 'string',
      format: 'email',
      maxLength: TENANT_EMAIL_MAX_LENGTH,
      pattern: EMAIL_PATTERN.source,
      description: 'Unique among tenants, ignoring case (`duplicate`).',
      example: 'info@nordic-pixel.example',
    },
    phone: nullable({
      type: 'string',
      minLength: TENANT_PHONE_MIN_LENGTH,
      maxLength: TENANT_PHONE_MAX_LENGTH,
      pattern: PHONE_PATTERN.source,
      description: 'Digits, spaces, `+`, `-` and parentheses; `null` when empty.',
    }),
    notes: text(TENANT_NOTES_MAX_LENGTH, { description: 'Optional; empty when missing.' }),
  },
  ['type', 'name', 'email'],
)

const leaseInput = object(
  {
    tenantId: id('The tenant; it must exist (`notFound`). Fixed once the lease exists.', 'tenant-nordic-pixel'),
    spaceId: id(
      'The space; it must exist (`notFound`). Fixed once the lease exists. The period must not overlap another lease of the space (`overlap`), and a lease active today cannot start on a space in maintenance (`maintenance`).',
      'space-kuopio-harbour-10',
    ),
    startDate: date('First day of the lease.'),
    endDate: nullable(date('Last day of the lease, not before the start (`beforeStart`); `null` for an open-ended lease.')),
    monthlyRentCents: nullable({
      type: 'integer',
      minimum: 1,
      maximum: MONTHLY_RENT_MAX_CENTS,
      description: 'Optional monthly rent in euro cents, e.g. 125050 = 1 250,50 €.',
      example: 125050,
    }),
  },
  ['tenantId', 'spaceId', 'startDate'],
  'The status (upcoming, active, ended) is derived from the dates and not stored. Both dates count as days of the lease; "today" is the server\'s UTC date.',
)

const suggestionRequest = object(
  {
    title: text(MAINTENANCE_TITLE_MAX_LENGTH, { example: 'kitchen sink leak' }),
    description: text(SUGGESTION_DESCRIPTION_MAX_LENGTH),
    language: { ...oneOf(LANGUAGES, 'Language of the suggested title and description.'), default: 'en' },
  },
  [],
  'A title, a description or both are required.',
)

const askRequest = object(
  {
    question: requiredText(ASK_QUESTION_MAX_LENGTH, { example: 'available three-room apartment with a sauna' }),
    today: date("The user's calendar date, for relative dates such as \"next month\".", '2026-09-24'),
  },
  ['question', 'today'],
)

/** A filter field as JSON Schema, from the same definitions that check the model's answer. */
function askField(spec: FieldSpec): Schema {
  const description = spec.description
  switch (spec.kind) {
    case 'text':
      return text(ASK_TEXT_MAX_LENGTH, { description: `${description}. Contains, ignoring case.` })
    case 'enum':
      return {
        type: 'array',
        items: oneOf(spec.values),
        uniqueItems: true,
        description: `${description}. ${spec.all ? 'Every one must match.' : 'Any one matches.'}`,
      }
    case 'range': {
      const bound = { type: spec.integer ? 'integer' : 'number', minimum: spec.min, maximum: spec.max }
      return { type: 'object', properties: { min: bound, max: bound }, description: `${description}. Inclusive.` }
    }
    case 'dates':
      return {
        type: 'object',
        properties: { from: { type: 'string', format: 'date' }, to: { type: 'string', format: 'date' } },
        description: `${description}. Inclusive.`,
      }
    case 'boolean':
      return { type: 'boolean', description }
  }
}

const askFilters = object(
  Object.fromEntries(
    AREAS.map((area) => [
      area,
      {
        type: 'object',
        properties: Object.fromEntries(Object.entries(AREA_FIELDS[area]).map(([field, spec]) => [field, askField(spec)])),
        additionalProperties: false,
      },
    ]),
  ),
  [],
  'The fields a search filter can have, per area. An answer has only the fields the question uses.',
)

const askAnswer: Schema = {
  oneOf: [
    object(
      { kind: { type: 'string', const: 'navigate' }, place: oneOf(PLACE_IDS, 'Where in the app to go.') },
      ['kind', 'place'],
      'The question asks where something is in the app.',
    ),
    object(
      {
        kind: { type: 'string', const: 'search' },
        area: oneOf(AREAS),
        filter: {
          type: 'object',
          additionalProperties: true,
          description: "The area's fields the question uses, see `AskFilters`. Empty lists everything in the area.",
          example: { types: ['apartment'], statuses: ['available'], rooms: { min: 3, max: 3 }, features: ['sauna'] },
        },
        sort: object(
          {
            by: {
              type: 'string',
              enum: [...new Set(Object.values(AREA_SORTS).flat())],
              description: "One of the area's sort fields.",
            },
            direction: oneOf(SORT_DIRECTIONS),
          },
          ['by', 'direction'],
        ),
        ignored: {
          type: 'array',
          items: { type: 'string' },
          maxItems: ASK_IGNORED_MAX,
          description: 'Words of the question that could not be used, e.g. "cheap"; always copied from the question.',
        },
      },
      ['kind', 'area', 'filter', 'ignored'],
      'The question looks for data; the client searches its own data with the filter.',
    ),
    object(
      { kind: { type: 'string', const: 'none' } },
      ['kind'],
      'The question is about something the app cannot help with.',
    ),
  ],
}

export const SCHEMAS: Record<string, Schema> = {
  Health: object(
    { status: { type: 'string', const: 'ok' }, version: { type: 'string', example: '0.12.0' } },
    ['status', 'version'],
  ),
  Features: object(
    {
      maintenanceSuggestions: {
        type: 'boolean',
        description: 'Whether AI maintenance suggestions are available (an AI provider is configured).',
      },
      ask: {
        type: 'boolean',
        description: 'Whether `POST /api/ask` is available (an AI provider is configured).',
      },
    },
    ['maintenanceSuggestions', 'ask'],
  ),
  PropertyInput: propertyInput,
  Property: entity(propertyInput),
  SpaceInput: spaceInput,
  Space: entity(spaceInput),
  MaintenanceTaskInput: maintenanceInput,
  MaintenanceTask: entity(maintenanceInput, {
    completedAt: {
      type: ['string', 'null'],
      format: 'date-time',
      readOnly: true,
      description: 'Set by the server when the task is completed; kept while it stays completed, cleared when reopened.',
    },
  }),
  TenantInput: tenantInput,
  Tenant: entity(tenantInput),
  LeaseInput: leaseInput,
  Lease: entity(leaseInput),
  SuggestionRequest: suggestionRequest,
  AskRequest: askRequest,
  AskAnswer: askAnswer,
  AskFilters: askFilters,
  MaintenanceSuggestion: object(
    {
      title: requiredText(MAINTENANCE_TITLE_MAX_LENGTH),
      description: requiredText(MAINTENANCE_DESCRIPTION_MAX_LENGTH, {
        description: 'The problem in the user\'s own facts, followed by a list of things to check.',
      }),
      category: oneOf(MAINTENANCE_CATEGORIES),
      priority: oneOf(MAINTENANCE_PRIORITIES),
    },
    ['title', 'description', 'category', 'priority'],
  ),
  Error: object(
    {
      error: {
        type: 'object',
        properties: {
          code: oneOf(ERROR_CODES, 'Machine-readable code; clients translate it. Never English text.'),
          fields: { $ref: '#/components/schemas/FieldErrors', description: 'Only with `validation_failed`.' },
        },
        required: ['code'],
        additionalProperties: true,
        description: 'May carry extra machine-readable details next to the code, e.g. counts or invalid fields.',
      },
    },
    ['error'],
  ),
  FieldErrors: {
    type: 'object',
    additionalProperties: oneOf(FIELD_ERROR_CODES),
    description: 'An error code per invalid field.',
    example: { name: 'required', postalCode: 'invalid' },
  },
}
