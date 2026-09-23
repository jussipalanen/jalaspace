import type { ErrorCode } from '../errors.ts'
import type { RouteInfo } from './routes.ts'
import { SCHEMAS, type Schema } from './schemas.ts'

// Builds the OpenAPI 3.1 description from the routes the API actually has
// (see listRoutes) and the schemas generated from the domain constants. Only
// the summaries and descriptions below are written by hand; a test fails when
// a route has none.

type Operation = Record<string, unknown>

const ref = (name: string): Schema => ({ $ref: `#/components/schemas/${name}` })

const json = (schema: Schema, example?: unknown) => ({
  'application/json': { schema, ...(example === undefined ? {} : { example }) },
})

const ok = (description: string, schema: Schema) => ({ description, content: json(schema) })

/**
 * An error response with one example per code, e.g. `{ "error": { "code": "not_found" } }`.
 * `details` adds machine-readable fields to a code's example.
 */
function error(description: string, codes: ErrorCode[], details: Partial<Record<ErrorCode, object>> = {}) {
  return {
    description,
    content: {
      'application/json': {
        schema: ref('Error'),
        examples: Object.fromEntries(
          codes.map((code) => [code, { value: { error: { code, ...details[code] } } }]),
        ),
      },
    },
  }
}

const validationError = error('Invalid input; `fields` has an error code per field.', ['validation_failed', 'invalid_json'], {
  validation_failed: { fields: { name: 'required' } },
})
const notFound = error('No resource with this id.', ['not_found'])
const internalError = error('Unexpected error; details are only logged on the server.', ['internal_error'])
const tooLarge = error('The request body is over 100 kB.', ['payload_too_large'])

/** Valid request bodies; a test checks them against the API's own validation. */
export const EXAMPLES = {
  PropertyInput: {
    name: 'Oulu Office House',
    type: 'office',
    address: 'Kauppurienkatu 3',
    postalCode: '90100',
    city: 'Oulu',
    description: 'Office building near the market square.',
  },
  SpaceInput: {
    propertyId: 'property-joensuu-center',
    name: 'A 501',
    type: 'office',
    floor: 5,
    areaM2: 62.5,
    status: 'available',
  },
  MaintenanceTaskInput: {
    propertyId: 'property-joensuu-center',
    spaceId: null,
    title: 'Main entrance door closer broken',
    description: 'The door does not close by itself.',
    category: 'general',
    priority: 'high',
    status: 'open',
    dueDate: '2026-10-01',
  },
  TenantInput: {
    type: 'company',
    name: 'Lakeside Bakery Oy',
    contactPerson: 'Maija Salo',
    email: 'info@lakeside-bakery.example',
    phone: '+358 40 123 4567',
    notes: '',
  },
  LeaseInput: {
    tenantId: 'tenant-aurora-yoga',
    spaceId: 'space-kuopio-harbour-10',
    startDate: '2026-10-01',
    endDate: null,
    monthlyRentCents: 125050,
  },
  SuggestionRequest: { title: 'kitchen sink leak', description: '', language: 'en' },
} as const

interface Collection {
  tag: string
  path: string
  singular: string
  schema: string
  input: keyof typeof EXAMPLES
  /** What `DELETE` refuses, if anything. */
  inUse?: { code: ErrorCode; description: string; details: object }
  notes?: { create?: string; update?: string; delete?: string }
}

const COLLECTIONS: Collection[] = [
  {
    tag: 'Properties',
    path: '/api/properties',
    singular: 'property',
    schema: 'Property',
    input: 'PropertyInput',
    inUse: {
      code: 'property_in_use',
      description: 'The property still has spaces or maintenance tasks.',
      details: { spaceCount: 2, maintenanceCount: 1 },
    },
  },
  {
    tag: 'Spaces',
    path: '/api/units',
    singular: 'space',
    schema: 'Space',
    input: 'SpaceInput',
    inUse: {
      code: 'space_in_use',
      description: 'The space still has leases or maintenance tasks.',
      details: { leaseCount: 1, maintenanceCount: 2 },
    },
    notes: {
      update: 'The status follows the leases, whatever the client sends.',
    },
  },
  {
    tag: 'Maintenance',
    path: '/api/maintenance',
    singular: 'maintenance task',
    schema: 'MaintenanceTask',
    input: 'MaintenanceTaskInput',
    notes: {
      update: 'Change the status with an update; the server sets and clears `completedAt`.',
      delete: 'Nothing refers to a task, so it can always be deleted.',
    },
  },
  {
    tag: 'Tenants',
    path: '/api/tenants',
    singular: 'tenant',
    schema: 'Tenant',
    input: 'TenantInput',
    inUse: {
      code: 'tenant_in_use',
      description: 'The tenant still has leases (current, upcoming or past).',
      details: { leaseCount: 2 },
    },
  },
  {
    tag: 'Leases',
    path: '/api/leases',
    singular: 'lease',
    schema: 'Lease',
    input: 'LeaseInput',
    notes: {
      create: "Afterwards the space is occupied exactly when it has an active lease.",
      update: 'Changes only the period and the rent; the stored tenant and space are kept. The space status follows.',
      delete: 'Cancels the lease; the space status follows.',
    },
  },
]

function collectionOperations(c: Collection): Record<string, Operation> {
  const item = `${c.path}/{id}`
  const body = { required: true, content: json(ref(c.input), EXAMPLES[c.input]) }
  const tags = [c.tag]
  return {
    [`get ${c.path}`]: {
      tags,
      summary: `List ${c.tag.toLowerCase()}`,
      operationId: `list${c.tag}`,
      responses: { 200: ok(`All ${c.tag.toLowerCase()}`, { type: 'array', items: ref(c.schema) }), 500: internalError },
    },
    [`get ${item}`]: {
      tags,
      summary: `Get a ${c.singular}`,
      operationId: `get${c.schema}`,
      responses: { 200: ok(`The ${c.singular}`, ref(c.schema)), 404: notFound, 500: internalError },
    },
    [`post ${c.path}`]: {
      tags,
      summary: `Create a ${c.singular}`,
      description: [
        'The server assigns `id`, `createdAt` and `updatedAt`; other fields it does not know are ignored.',
        c.notes?.create,
      ]
        .filter(Boolean)
        .join(' '),
      operationId: `create${c.schema}`,
      requestBody: body,
      responses: {
        201: {
          ...ok(`The created ${c.singular}`, ref(c.schema)),
          headers: { Location: { description: 'URL of the new resource.', schema: { type: 'string' } } },
        },
        400: validationError,
        413: tooLarge,
        500: internalError,
      },
    },
    [`put ${item}`]: {
      tags,
      summary: `Update a ${c.singular}`,
      description: ['Replaces every editable field; missing optional fields are cleared.', c.notes?.update]
        .filter(Boolean)
        .join(' '),
      operationId: `update${c.schema}`,
      requestBody: body,
      responses: {
        200: ok(`The updated ${c.singular}`, ref(c.schema)),
        400: validationError,
        404: notFound,
        413: tooLarge,
        500: internalError,
      },
    },
    [`delete ${item}`]: {
      tags,
      summary: `Delete a ${c.singular}`,
      ...(c.notes?.delete ? { description: c.notes.delete } : {}),
      operationId: `delete${c.schema}`,
      responses: {
        204: { description: 'Deleted.' },
        404: notFound,
        ...(c.inUse
          ? { 409: error(c.inUse.description, [c.inUse.code], { [c.inUse.code]: c.inUse.details }) }
          : {}),
        500: internalError,
      },
    },
  }
}

/** Hand-written summaries and descriptions per route (`method path`). */
export const OPERATIONS: Record<string, Operation> = {
  'get /api/health': {
    tags: ['Service'],
    summary: 'Health check',
    operationId: 'getHealth',
    responses: { 200: ok('The API is running', ref('Health')) },
  },
  'get /api/features': {
    tags: ['Service'],
    summary: 'Optional features',
    description: 'Which optional features this API offers, so clients can hide what is unavailable.',
    operationId: 'getFeatures',
    responses: { 200: ok('Feature flags', ref('Features')) },
  },
  ...Object.assign({}, ...COLLECTIONS.map(collectionOperations)),
  'post /api/maintenance/suggestions': {
    tags: ['Maintenance'],
    summary: 'Suggest maintenance task details with AI',
    description:
      'Suggests a title, a description, a category and a priority from a title, a description or both. Nothing is stored. Each client can ask for 10 suggestions per 10 minutes.',
    operationId: 'suggestMaintenanceTask',
    requestBody: { required: true, content: json(ref('SuggestionRequest'), EXAMPLES.SuggestionRequest) },
    responses: {
      200: ok('The suggestion', ref('MaintenanceSuggestion')),
      400: validationError,
      429: {
        ...error('Too many suggestions from this client, or the AI quota is used up.', ['rate_limited']),
        headers: { 'Retry-After': { description: 'Seconds to wait.', schema: { type: 'integer' } } },
      },
      502: error('The AI answered, but not with a usable suggestion.', ['invalid_suggestion']),
      503: error('No AI provider is configured, or it failed or timed out.', ['ai_unavailable']),
      500: internalError,
    },
  },
  'post /api/demo/reset': {
    tags: ['Demo data'],
    summary: 'Restore the demo data',
    description:
      'Removes all data and restores the demo dataset, for everyone who uses this API. Exists only when the server runs with `SEED_DEMO_DATA=true`.',
    operationId: 'resetDemoData',
    responses: { 204: { description: 'The demo data was restored.' }, 500: internalError },
  },
}

const TAGS = [
  { name: 'Service', description: 'Health and optional features.' },
  { name: 'Properties', description: 'Buildings and sites.' },
  { name: 'Spaces', description: 'Units within properties, served under `/api/units`.' },
  { name: 'Maintenance', description: 'Maintenance tasks and AI suggestions for them.' },
  { name: 'Tenants', description: 'Companies and people who rent spaces.' },
  { name: 'Leases', description: 'Tenants renting spaces for a period.' },
  { name: 'Demo data', description: 'Restoring the demo dataset.' },
]

export interface OpenApiDocument {
  openapi: string
  info: Record<string, unknown>
  servers: { url: string; description: string }[]
  security: []
  tags: typeof TAGS
  paths: Record<string, Record<string, Operation>>
  components: { schemas: Record<string, Schema> }
}

/** `{name}` placeholders of a path as OpenAPI path parameters. */
function pathParameters(path: string) {
  return [...path.matchAll(/\{(\w+)\}/g)].map(([, name]) => ({
    name,
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }))
}

/**
 * The OpenAPI description of the given routes. A route without a hand-written
 * summary is still listed, marked `x-undocumented`; tests make sure there are none.
 */
export function buildOpenApiDocument(routes: RouteInfo[], version: string): OpenApiDocument {
  const paths: OpenApiDocument['paths'] = {}
  for (const { method, path } of routes) {
    const operation = OPERATIONS[`${method} ${path}`] ?? {
      summary: 'Undocumented route',
      'x-undocumented': true,
      responses: { default: { description: 'Not documented.' } },
    }
    const parameters = pathParameters(path)
    paths[path] = { ...paths[path], [method]: parameters.length ? { parameters, ...operation } : operation }
  }
  const usedTags = new Set(Object.values(paths).flatMap((item) => Object.values(item).flatMap((op) => (op.tags as string[]) ?? [])))

  return {
    openapi: '3.1.0',
    info: {
      title: 'JalaSpace API',
      version,
      summary: 'REST API of JalaSpace, a property and space management demo.',
      description: [
        'All routes send and receive JSON. Errors return a machine-readable code, never English text: `{ "error": { "code": "not_found" } }`.',
        'The data is demo data kept in memory: it returns to the demo dataset whenever the server restarts, and everyone who uses this API shares it.',
        'This description is generated from the running API: its routes and the same constants the validation uses.',
      ].join('\n\n'),
    },
    servers: [{ url: '/', description: 'This server' }],
    // No authentication: the API is a public demo (sign-in is simulated in the browser).
    security: [],
    tags: TAGS.filter((tag) => usedTags.has(tag.name)),
    paths,
    components: { schemas: SCHEMAS },
  }
}
