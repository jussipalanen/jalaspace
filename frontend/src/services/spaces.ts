import type { IsoDate, IsoDateTime } from '../types/common'
import type { Lease } from '../types/lease'
import type { MaintenanceTask } from '../types/maintenance'
import type { Property } from '../types/property'
import type { Space, SpaceStatus, SpaceType } from '../types/space'
import type { Tenant } from '../types/tenant'
import { generateId } from '../utils/id'
import { getLeaseStatus } from './leases'

export const SPACE_TYPES: readonly SpaceType[] = [
  'office',
  'retail',
  'industrial',
  'storage',
  'apartment',
]
export const SPACE_STATUSES: readonly SpaceStatus[] = ['available', 'occupied', 'maintenance']
/** Statuses a user can choose; "occupied" follows from an active lease. */
export const MANUAL_SPACE_STATUSES: readonly SpaceStatus[] = ['available', 'maintenance']

export const SPACE_NAME_MAX_LENGTH = 50
export const SPACE_FLOOR_MIN = -10
export const SPACE_FLOOR_MAX = 200
export const SPACE_AREA_MAX = 100_000

export function isSpaceType(value: string): value is SpaceType {
  return (SPACE_TYPES as readonly string[]).includes(value)
}

export function isSpaceStatus(value: string): value is SpaceStatus {
  return (SPACE_STATUSES as readonly string[]).includes(value)
}

/** Form values; floor and area are the raw text the user typed. */
export interface SpaceFormValues {
  propertyId: string
  name: string
  type: SpaceType
  floor: string
  area: string
  status: SpaceStatus
}

/** Error codes per field; the UI translates them (`spaces.form.validation.<field>.<code>`). */
export interface SpaceFormErrors {
  propertyId?: 'required' | 'notFound' | 'maintenanceLinked'
  name?: 'required' | 'tooLong' | 'duplicate'
  floor?: 'required' | 'invalid'
  area?: 'required' | 'invalid'
}

export function emptySpaceForm(propertyId = ''): SpaceFormValues {
  return { propertyId, name: '', type: 'office', floor: '1', area: '', status: 'available' }
}

export function toSpaceForm(space: Space, locale: string): SpaceFormValues {
  return {
    propertyId: space.propertyId,
    name: space.name,
    type: space.type,
    floor: String(space.floor),
    area: new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 2 }).format(
      space.areaM2,
    ),
    status: space.status,
  }
}

/** Parses a whole floor number, or `null` if invalid or out of range. */
export function parseFloor(value: string): number | null {
  const trimmed = value.trim().replace('−', '-')
  if (!/^-?\d+$/.test(trimmed)) return null
  const floor = Number(trimmed)
  return floor >= SPACE_FLOOR_MIN && floor <= SPACE_FLOOR_MAX ? floor : null
}

/** Parses an area in m², accepting a decimal comma; `null` if invalid or out of range. */
export function parseArea(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const area = Number(normalized)
  return area > 0 && area <= SPACE_AREA_MAX ? area : null
}

/**
 * Validates the form. `otherSpaces` are the property's other spaces, used to
 * keep space names unique within a property (case-insensitive).
 */
export function validateSpaceForm(
  values: SpaceFormValues,
  otherSpaces: Pick<Space, 'id' | 'propertyId' | 'name'>[],
  editingId?: string,
): SpaceFormErrors {
  const errors: SpaceFormErrors = {}
  const name = values.name.trim()

  if (!values.propertyId) errors.propertyId = 'required'

  if (!name) errors.name = 'required'
  else if (name.length > SPACE_NAME_MAX_LENGTH) errors.name = 'tooLong'
  else if (
    otherSpaces.some(
      (space) =>
        space.id !== editingId &&
        space.propertyId === values.propertyId &&
        space.name.trim().toLowerCase() === name.toLowerCase(),
    )
  ) {
    errors.name = 'duplicate'
  }

  if (!values.floor.trim()) errors.floor = 'required'
  else if (parseFloor(values.floor) === null) errors.floor = 'invalid'

  if (!values.area.trim()) errors.area = 'required'
  else if (parseArea(values.area) === null) errors.area = 'invalid'

  return errors
}

/** The lease that is active today for a space, if any. */
export function findActiveLease(spaceId: string, leases: Lease[], today: IsoDate): Lease | null {
  return (
    leases.find((lease) => lease.spaceId === spaceId && getLeaseStatus(lease, today) === 'active') ??
    null
  )
}

/**
 * Applies the business rule "an active lease means occupied": with an active
 * lease the space is always occupied; without one it cannot be occupied.
 */
export function resolveSpaceStatus(requested: SpaceStatus, hasActiveLease: boolean): SpaceStatus {
  if (hasActiveLease) return 'occupied'
  return requested === 'occupied' ? 'available' : requested
}

function normalize(values: SpaceFormValues): Omit<Space, 'id' | 'createdAt' | 'updatedAt' | 'status'> {
  return {
    propertyId: values.propertyId,
    name: values.name.trim(),
    type: values.type,
    floor: parseFloor(values.floor) ?? 0,
    areaM2: parseArea(values.area) ?? 0,
  }
}

export function buildNewSpace(
  values: SpaceFormValues,
  now: IsoDateTime,
  id: string = generateId(),
): Space {
  return {
    id,
    ...normalize(values),
    // A new space has no leases yet.
    status: resolveSpaceStatus(values.status, false),
    createdAt: now,
    updatedAt: now,
  }
}

export function applySpaceChanges(
  space: Space,
  values: SpaceFormValues,
  hasActiveLease: boolean,
  now: IsoDateTime,
): Space {
  return {
    ...space,
    ...normalize(values),
    status: resolveSpaceStatus(values.status, hasActiveLease),
    updatedAt: now,
  }
}

export interface SpaceRow {
  space: Space
  property: Property | null
  tenant: Tenant | null
}

export interface SpaceFilters {
  propertyId: string
  status: SpaceStatus | ''
  query: string
}

/** Joins spaces with their property and current tenant, sorted by property and space name. */
export function buildSpaceRows(
  spaces: Space[],
  properties: Property[],
  leases: Lease[],
  tenants: Tenant[],
  today: IsoDate,
  locale: string,
): SpaceRow[] {
  const propertiesById = new Map(properties.map((property) => [property.id, property]))
  const tenantsById = new Map(tenants.map((tenant) => [tenant.id, tenant]))
  const collator = new Intl.Collator(locale, { numeric: true })

  return spaces
    .map((space) => {
      const lease = findActiveLease(space.id, leases, today)
      return {
        space,
        property: propertiesById.get(space.propertyId) ?? null,
        tenant: lease ? (tenantsById.get(lease.tenantId) ?? null) : null,
      }
    })
    .toSorted(
      (a, b) =>
        collator.compare(a.property?.name ?? '', b.property?.name ?? '') ||
        collator.compare(a.space.name, b.space.name),
    )
}

export function filterSpaceRows(rows: SpaceRow[], filters: SpaceFilters, locale: string): SpaceRow[] {
  const query = filters.query.trim().toLocaleLowerCase(locale)
  return rows.filter(
    ({ space, tenant }) =>
      (!filters.propertyId || space.propertyId === filters.propertyId) &&
      (!filters.status || space.status === filters.status) &&
      (!query ||
        space.name.toLocaleLowerCase(locale).includes(query) ||
        (tenant?.name.toLocaleLowerCase(locale).includes(query) ?? false)),
  )
}

export interface SpaceDeletionCheck {
  allowed: boolean
  leaseCount: number
  maintenanceCount: number
}

/** A space can only be deleted when no lease or maintenance task refers to it. */
export function checkSpaceDeletion(
  spaceId: string,
  leases: Lease[],
  maintenance: MaintenanceTask[],
): SpaceDeletionCheck {
  const leaseCount = leases.filter((lease) => lease.spaceId === spaceId).length
  const maintenanceCount = maintenance.filter((task) => task.spaceId === spaceId).length
  return { allowed: leaseCount === 0 && maintenanceCount === 0, leaseCount, maintenanceCount }
}

/**
 * Spaces whose stored status no longer matches their leases today, with the
 * corrected status: occupied while a lease is active, otherwise not occupied.
 * Used to catch up when a lease has started or ended since the last visit.
 */
export function reconcileSpaceStatuses(spaces: Space[], leases: Lease[], today: IsoDate): Space[] {
  return spaces.flatMap((space) => {
    const status = resolveSpaceStatus(space.status, findActiveLease(space.id, leases, today) !== null)
    return status === space.status ? [] : [{ ...space, status }]
  })
}
