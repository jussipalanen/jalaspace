import type { IsoDate } from '../types/common'
import type { Lease, LeaseStatus } from '../types/lease'
import type { Property } from '../types/property'
import type { Tenant } from '../types/tenant'
import { toIsoDate } from '../utils/date'
import {
  AREA_SORTS,
  LEASE_FIELDS,
  MAINTENANCE_FIELDS,
  PROPERTY_FIELDS,
  SPACE_FIELDS,
  TENANT_FIELDS,
  type Area,
  type AskSearch,
  type AskSort,
  type DateRange,
  type FieldSpec,
  type FilterValue,
  type NumberRange,
} from './ask'
import type { DashboardInput } from './dashboard'
import { buildLeaseRows, getLeaseStatus, type LeaseRow } from './leases'
import { buildMaintenanceRows, isMaintenanceOverdue, type MaintenanceRow } from './maintenance'
import { summarizeProperties, type PropertySummary } from './properties'
import { buildSpaceRows, findActiveLease, SPACE_ROOMS_FILTER_MAX, type SpaceRow } from './spaces'

// Runs an "Ask JalaSpace" search on the app's own data. Derived values use the
// same rules as the pages, e.g. occupancy and overdue tasks.

export interface SpaceResult extends SpaceRow {
  /** The rent under the active lease, if any. */
  monthlyRentCents: number | null
  /** Has an upcoming lease. */
  reserved: boolean
}

export interface TenantResult {
  tenant: Tenant
  leaseStatuses: LeaseStatus[]
  /** Properties where the tenant has an active or upcoming lease. */
  properties: Property[]
}

export interface MaintenanceResult extends MaintenanceRow {
  overdue: boolean
}

export type AskResults =
  | { area: 'properties'; rows: PropertySummary[] }
  | { area: 'spaces'; rows: SpaceResult[] }
  | { area: 'tenants'; rows: TenantResult[] }
  | { area: 'leases'; rows: LeaseRow[] }
  | { area: 'maintenance'; rows: MaintenanceResult[] }

type Text = string | null | undefined

/** What each field reads from a row, by the kind of field. */
type Accessor<Row, Spec> = Spec extends { kind: 'text' }
  ? (row: Row) => Text[]
  : Spec extends { kind: 'enum' }
    ? (row: Row) => string | readonly string[]
    : Spec extends { kind: 'range' }
      ? (row: Row) => number | null
      : Spec extends { kind: 'dates' }
        ? (row: Row) => IsoDate | null
        : (row: Row) => boolean

/** One accessor per field; TypeScript reports a field that the search cannot read. */
type Accessors<Row, Fields> = { [Field in keyof Fields]: Accessor<Row, Fields[Field]> }

type SortValue = string | number | null
/** One reader per sort field of the area. */
type Sorts<Row, A extends Area> = Record<(typeof AREA_SORTS)[A][number], (row: Row) => SortValue>

const addedOn = (createdAt: string): IsoDate => toIsoDate(new Date(createdAt))
const euros = (cents: number | null) => (cents === null ? null : cents / 100)
const PRIORITY_ORDER = { low: 0, medium: 1, high: 2 } as const

function matches(spec: FieldSpec, value: FilterValue, read: unknown, locale: string): boolean {
  switch (spec.kind) {
    case 'text': {
      const needle = (value as string).toLocaleLowerCase(locale)
      return (read as Text[]).some((text) => text?.toLocaleLowerCase(locale).includes(needle))
    }
    case 'enum': {
      const wanted = value as string[]
      const actual = typeof read === 'string' ? [read] : (read as readonly string[])
      return spec.all ? wanted.every((item) => actual.includes(item)) : wanted.some((item) => actual.includes(item))
    }
    case 'range': {
      const { min, max } = value as NumberRange
      const number = read as number | null
      return number !== null && (min === undefined || number >= min) && (max === undefined || number <= max)
    }
    case 'dates': {
      const { from, to } = value as DateRange
      const date = read as IsoDate | null
      return date !== null && (!from || date >= from) && (!to || date <= to)
    }
    case 'boolean':
      return read === value
  }
}

function applySearch<Row>(
  rows: Row[],
  fields: Record<string, FieldSpec>,
  accessors: Record<string, (row: Row) => unknown>,
  sorts: Record<string, (row: Row) => SortValue>,
  search: AskSearch,
  locale: string,
): Row[] {
  const entries = Object.entries(search.filter)
  const found = rows.filter((row) =>
    entries.every(([field, value]) => matches(fields[field]!, value, accessors[field]!(row), locale)),
  )
  return search.sort ? sortRows(found, sorts[search.sort.by]!, search.sort, locale) : found
}

/** Sorts by one value; rows without it come last in both directions. */
function sortRows<Row>(rows: Row[], read: (row: Row) => SortValue, sort: AskSort, locale: string): Row[] {
  const collator = new Intl.Collator(locale, { numeric: true })
  const sign = sort.direction === 'asc' ? 1 : -1
  return rows.toSorted((a, b) => {
    const x = read(a)
    const y = read(b)
    if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1
    return sign * (typeof x === 'number' && typeof y === 'number' ? x - y : collator.compare(String(x), String(y)))
  })
}

function searchProperties(data: DashboardInput, search: AskSearch, locale: string): PropertySummary[] {
  const rows = summarizeProperties(data.properties, data.spaces, data.maintenance, locale)
  const accessors: Accessors<PropertySummary, typeof PROPERTY_FIELDS> = {
    text: ({ property }) => [property.name, property.address, property.description],
    name: ({ property }) => [property.name],
    address: ({ property }) => [property.address],
    postalCode: ({ property }) => [property.postalCode],
    city: ({ property }) => [property.city],
    types: ({ property }) => property.type,
    spaces: (row) => row.spaceCount,
    occupancyPercent: (row) => row.occupancyPercent,
    openMaintenance: (row) => row.openMaintenanceCount,
    added: ({ property }) => addedOn(property.createdAt),
  }
  const sorts: Sorts<PropertySummary, 'properties'> = {
    name: ({ property }) => property.name,
    city: ({ property }) => property.city,
    spaces: (row) => row.spaceCount,
    occupancyPercent: (row) => row.occupancyPercent,
    openMaintenance: (row) => row.openMaintenanceCount,
    added: ({ property }) => property.createdAt,
  }
  return applySearch(rows, PROPERTY_FIELDS, accessors, sorts, search, locale)
}

function searchSpaces(data: DashboardInput, search: AskSearch, today: IsoDate, locale: string): SpaceResult[] {
  const rows = buildSpaceRows(data.spaces, data.properties, data.leases, data.tenants, today, locale).map(
    (row): SpaceResult => ({
      ...row,
      monthlyRentCents: findActiveLease(row.space.id, data.leases, today)?.monthlyRentCents ?? null,
      reserved: data.leases.some(
        (lease) => lease.spaceId === row.space.id && getLeaseStatus(lease, today) === 'upcoming',
      ),
    }),
  )
  const accessors: Accessors<SpaceResult, typeof SPACE_FIELDS> = {
    text: ({ space }) => [space.name],
    name: ({ space }) => [space.name],
    property: ({ property }) => [property?.name],
    city: ({ property }) => [property?.city],
    types: ({ space }) => space.type,
    statuses: ({ space }) => space.status,
    floor: ({ space }) => space.floor,
    areaM2: ({ space }) => space.areaM2,
    rooms: ({ space }) => space.rooms,
    features: ({ space }) => space.features,
    reserved: (row) => row.reserved,
    tenant: ({ tenant }) => [tenant?.name],
    monthlyRentEur: (row) => euros(row.monthlyRentCents),
    added: ({ space }) => addedOn(space.createdAt),
  }
  const sorts: Sorts<SpaceResult, 'spaces'> = {
    name: ({ space }) => space.name,
    property: ({ property }) => property?.name ?? null,
    floor: ({ space }) => space.floor,
    areaM2: ({ space }) => space.areaM2,
    rooms: ({ space }) => space.rooms,
    monthlyRentEur: (row) => row.monthlyRentCents,
    added: ({ space }) => space.createdAt,
  }
  return applySearch(rows, SPACE_FIELDS, accessors, sorts, search, locale)
}

function searchTenants(data: DashboardInput, search: AskSearch, today: IsoDate, locale: string): TenantResult[] {
  const spacesById = new Map(data.spaces.map((space) => [space.id, space]))
  const propertiesById = new Map(data.properties.map((property) => [property.id, property]))
  const collator = new Intl.Collator(locale, { numeric: true })
  const rows = data.tenants
    .map((tenant): TenantResult => {
      const leases = data.leases.filter((lease: Lease) => lease.tenantId === tenant.id)
      const statuses = leases.map((lease) => ({ lease, status: getLeaseStatus(lease, today) }))
      const properties = statuses
        .filter(({ status }) => status !== 'ended')
        .map(({ lease }) => propertiesById.get(spacesById.get(lease.spaceId)?.propertyId ?? ''))
        .filter((property): property is Property => property !== undefined)
      return {
        tenant,
        leaseStatuses: [...new Set(statuses.map(({ status }) => status))],
        properties: [...new Set(properties)],
      }
    })
    .toSorted((a, b) => collator.compare(a.tenant.name, b.tenant.name))

  const accessors: Accessors<TenantResult, typeof TENANT_FIELDS> = {
    text: ({ tenant }) => [tenant.name, tenant.contactPerson, tenant.email, tenant.phone, tenant.notes],
    types: ({ tenant }) => tenant.type,
    name: ({ tenant }) => [tenant.name],
    contactPerson: ({ tenant }) => [tenant.contactPerson],
    email: ({ tenant }) => [tenant.email],
    phone: ({ tenant }) => [tenant.phone],
    notes: ({ tenant }) => [tenant.notes],
    leaseStatuses: (row) => (row.leaseStatuses.length > 0 ? row.leaseStatuses : ['none']),
    property: (row) => row.properties.map((property) => property.name),
    city: (row) => row.properties.map((property) => property.city),
    added: ({ tenant }) => addedOn(tenant.createdAt),
  }
  const sorts: Sorts<TenantResult, 'tenants'> = {
    name: ({ tenant }) => tenant.name,
    type: ({ tenant }) => tenant.type,
    added: ({ tenant }) => tenant.createdAt,
  }
  return applySearch(rows, TENANT_FIELDS, accessors, sorts, search, locale)
}

function searchLeases(data: DashboardInput, search: AskSearch, today: IsoDate, locale: string): LeaseRow[] {
  const rows = buildLeaseRows(data.leases, data.tenants, data.spaces, data.properties, today, locale)
  const accessors: Accessors<LeaseRow, typeof LEASE_FIELDS> = {
    text: ({ tenant, space, property }) => [tenant?.name, space?.name, property?.name],
    tenant: ({ tenant }) => [tenant?.name],
    tenantTypes: ({ tenant }) => (tenant ? tenant.type : []),
    space: ({ space }) => [space?.name],
    spaceTypes: ({ space }) => (space ? space.type : []),
    property: ({ property }) => [property?.name],
    city: ({ property }) => [property?.city],
    statuses: (row) => row.status,
    startDate: ({ lease }) => lease.startDate,
    endDate: ({ lease }) => lease.endDate,
    openEnded: ({ lease }) => lease.endDate === null,
    monthlyRentEur: ({ lease }) => euros(lease.monthlyRentCents),
    added: ({ lease }) => addedOn(lease.createdAt),
  }
  const sorts: Sorts<LeaseRow, 'leases'> = {
    startDate: ({ lease }) => lease.startDate,
    endDate: ({ lease }) => lease.endDate,
    monthlyRentEur: ({ lease }) => lease.monthlyRentCents,
    tenant: ({ tenant }) => tenant?.name ?? null,
    added: ({ lease }) => lease.createdAt,
  }
  return applySearch(rows, LEASE_FIELDS, accessors, sorts, search, locale)
}

function searchMaintenance(
  data: DashboardInput,
  search: AskSearch,
  today: IsoDate,
  locale: string,
): MaintenanceResult[] {
  const rows = buildMaintenanceRows(data.maintenance, data.properties, data.spaces, locale).map((row) => ({
    ...row,
    overdue: isMaintenanceOverdue(row.task, today),
  }))
  const accessors: Accessors<MaintenanceResult, typeof MAINTENANCE_FIELDS> = {
    text: ({ task }) => [task.title, task.description],
    title: ({ task }) => [task.title],
    description: ({ task }) => [task.description],
    property: ({ property }) => [property?.name],
    space: ({ space }) => [space?.name],
    city: ({ property }) => [property?.city],
    categories: ({ task }) => task.category,
    priorities: ({ task }) => task.priority,
    statuses: ({ task }) => task.status,
    dueDate: ({ task }) => task.dueDate,
    overdue: (row) => row.overdue,
    completedAt: ({ task }) => (task.completedAt ? addedOn(task.completedAt) : null),
    added: ({ task }) => addedOn(task.createdAt),
  }
  const sorts: Sorts<MaintenanceResult, 'maintenance'> = {
    dueDate: ({ task }) => task.dueDate,
    priority: ({ task }) => PRIORITY_ORDER[task.priority],
    completedAt: ({ task }) => task.completedAt,
    title: ({ task }) => task.title,
    added: ({ task }) => task.createdAt,
  }
  return applySearch(rows, MAINTENANCE_FIELDS, accessors, sorts, search, locale)
}

/** Searches the data of the answer's area with its filter and sort. */
export function runAskSearch(data: DashboardInput, search: AskSearch, today: IsoDate, locale: string): AskResults {
  switch (search.area) {
    case 'properties':
      return { area: 'properties', rows: searchProperties(data, search, locale) }
    case 'spaces':
      return { area: 'spaces', rows: searchSpaces(data, search, today, locale) }
    case 'tenants':
      return { area: 'tenants', rows: searchTenants(data, search, today, locale) }
    case 'leases':
      return { area: 'leases', rows: searchLeases(data, search, today, locale) }
    case 'maintenance':
      return { area: 'maintenance', rows: searchMaintenance(data, search, today, locale) }
  }
}

const LIST_PATHS: Record<Area, string> = {
  properties: '/properties',
  spaces: '/units',
  tenants: '/tenants',
  leases: '/leases',
  maintenance: '/maintenance',
}

const single = (value: FilterValue) => (Array.isArray(value) && value.length === 1 ? value[0]! : null)

/** The list page's own URL filter for one field, or `null` when the page cannot express it. */
function listParam(area: Area, field: string, value: FilterValue): [string, string] | null {
  if (area === 'spaces') {
    if (field === 'statuses' && single(value)) return ['status', single(value)!]
    if (field === 'features') return ['features', (value as string[]).join(',')]
    if (field === 'rooms') {
      const { min, max } = value as NumberRange
      if (min !== undefined && min === max && min < SPACE_ROOMS_FILTER_MAX) return ['rooms', String(min)]
      if (min === SPACE_ROOMS_FILTER_MAX && max === undefined) return ['rooms', String(min)]
    }
  }
  if (area === 'tenants' && field === 'types' && single(value)) return ['type', single(value)!]
  if (area === 'leases' && field === 'statuses' && single(value)) return ['status', single(value)!]
  if (area === 'maintenance') {
    if (field === 'statuses' && single(value)) return ['status', single(value)!]
    if (field === 'priorities' && single(value)) return ['priority', single(value)!]
    if (field === 'overdue' && value === true) return ['overdue', '1']
  }
  return null
}

/**
 * A link to the area's list page with the same filter, when the page's own
 * filters can express all of it; otherwise `null`. The sort is not carried over.
 */
export function listPageLink(search: AskSearch): string | null {
  const params = new URLSearchParams()
  for (const [field, value] of Object.entries(search.filter)) {
    const param = listParam(search.area, field, value)
    if (!param) return null
    params.set(...param)
  }
  const query = params.toString()
  return query ? `${LIST_PATHS[search.area]}?${query}` : LIST_PATHS[search.area]
}
