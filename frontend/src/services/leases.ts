import type { IsoDate, IsoDateTime } from '../types/common'
import type { Lease, LeaseStatus } from '../types/lease'
import type { Property } from '../types/property'
import type { Space } from '../types/space'
import type { Tenant } from '../types/tenant'
import { parseDisplayDate } from '../utils/date'
import { formatDate } from '../utils/format'
import { generateId } from '../utils/id'

export const LEASE_STATUSES: readonly LeaseStatus[] = ['upcoming', 'active', 'ended']

/** Upper limit for a monthly rent, in euros. */
export const MONTHLY_RENT_MAX_EUROS = 1_000_000

export function isLeaseStatus(value: string): value is LeaseStatus {
  return (LEASE_STATUSES as readonly string[]).includes(value)
}

/**
 * A lease is active from its start date through its end date (both inclusive).
 * Date-only ISO strings compare correctly as plain strings.
 */
export function getLeaseStatus(
  lease: Pick<Lease, 'startDate' | 'endDate'>,
  today: IsoDate,
): LeaseStatus {
  if (lease.startDate > today) return 'upcoming'
  if (lease.endDate !== null && lease.endDate < today) return 'ended'
  return 'active'
}

/** True when two lease periods share at least one day; a `null` end runs indefinitely. */
export function periodsOverlap(
  a: Pick<Lease, 'startDate' | 'endDate'>,
  b: Pick<Lease, 'startDate' | 'endDate'>,
): boolean {
  return (b.endDate === null || a.startDate <= b.endDate) && (a.endDate === null || b.startDate <= a.endDate)
}

/** Another lease of the same space whose period overlaps `period`, if any. */
export function findOverlappingLease(
  spaceId: string,
  period: Pick<Lease, 'startDate' | 'endDate'>,
  leases: Lease[],
  ignoreId?: string,
): Lease | null {
  return (
    leases.find(
      (lease) => lease.spaceId === spaceId && lease.id !== ignoreId && periodsOverlap(lease, period),
    ) ?? null
  )
}

/** Parses a monthly rent in euros into cents, accepting a decimal comma and spaces; `null` if invalid. */
export function parseMonthlyRent(value: string): number | null {
  const normalized = value.trim().replace(/[\s  ]/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const euros = Number(normalized)
  if (euros <= 0 || euros > MONTHLY_RENT_MAX_EUROS) return null
  return Math.round(euros * 100)
}

/** Formats cents for the rent field, e.g. 125050 → "1250.5" or "1250,5" by locale, without grouping. */
export function formatRentInput(cents: number | null, locale: string): string {
  if (cents === null) return ''
  return new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 2 }).format(
    cents / 100,
  )
}

/** Values of the lease form, as typed. Tenant and space are fixed once a lease exists. */
export interface LeaseFormValues {
  tenantId: string
  propertyId: string
  spaceId: string
  /** `d.m.yyyy` */
  startDate: string
  /** `d.m.yyyy`; empty for an open-ended lease. */
  endDate: string
  /** Optional monthly rent in euros, e.g. `1 250,50`. */
  monthlyRent: string
}

/** Error codes per field; the UI translates them (`leases.form.validation.<field>.<code>`). */
export interface LeaseFormErrors {
  tenantId?: 'required' | 'notFound'
  propertyId?: 'required' | 'notFound'
  spaceId?: 'required' | 'notFound' | 'maintenance' | 'overlap'
  startDate?: 'required' | 'invalid'
  endDate?: 'invalid' | 'beforeStart'
  monthlyRent?: 'invalid'
}

export function emptyLeaseForm(
  today: IsoDate,
  preset: Partial<Pick<LeaseFormValues, 'tenantId' | 'propertyId' | 'spaceId'>> = {},
): LeaseFormValues {
  return {
    tenantId: preset.tenantId ?? '',
    propertyId: preset.propertyId ?? '',
    spaceId: preset.spaceId ?? '',
    startDate: formatDate(today),
    endDate: '',
    monthlyRent: '',
  }
}

export function toLeaseForm(lease: Lease, space: Space | null, locale: string): LeaseFormValues {
  return {
    tenantId: lease.tenantId,
    propertyId: space?.propertyId ?? '',
    spaceId: lease.spaceId,
    startDate: formatDate(lease.startDate),
    endDate: lease.endDate ? formatDate(lease.endDate) : '',
    monthlyRent: formatRentInput(lease.monthlyRentCents, locale),
  }
}

export interface LeaseValidationContext {
  tenants: Pick<Tenant, 'id'>[]
  properties: Pick<Property, 'id'>[]
  spaces: Space[]
  leases: Lease[]
  today: IsoDate
  /** The lease being edited; it does not overlap with itself. */
  editingId?: string
}

/**
 * Validates the form. The period must not overlap another lease of the same
 * space, and a lease that is active today cannot start on a space in maintenance.
 */
export function validateLeaseForm(values: LeaseFormValues, context: LeaseValidationContext): LeaseFormErrors {
  const errors: LeaseFormErrors = {}
  const { tenants, properties, spaces, leases, today, editingId } = context

  if (!values.tenantId) errors.tenantId = 'required'
  else if (!tenants.some((tenant) => tenant.id === values.tenantId)) errors.tenantId = 'notFound'

  if (!values.propertyId) errors.propertyId = 'required'
  else if (!properties.some((property) => property.id === values.propertyId)) {
    errors.propertyId = 'notFound'
  }

  const startDate = parseDisplayDate(values.startDate)
  if (!values.startDate.trim()) errors.startDate = 'required'
  else if (!startDate) errors.startDate = 'invalid'

  const endDate = values.endDate.trim() ? parseDisplayDate(values.endDate) : null
  if (values.endDate.trim() && !endDate) errors.endDate = 'invalid'
  else if (startDate && endDate && endDate < startDate) errors.endDate = 'beforeStart'

  if (values.monthlyRent.trim() && parseMonthlyRent(values.monthlyRent) === null) {
    errors.monthlyRent = 'invalid'
  }

  if (!values.spaceId) {
    if (!errors.propertyId) errors.spaceId = 'required'
    return errors
  }
  const space = spaces.find((item) => item.id === values.spaceId && item.propertyId === values.propertyId)
  if (!space) {
    errors.spaceId = 'notFound'
    return errors
  }
  // The period rules need valid dates; date errors are reported on their own fields.
  if (!startDate || errors.endDate) return errors

  const period = { startDate, endDate }
  if (findOverlappingLease(space.id, period, leases, editingId)) errors.spaceId = 'overlap'
  else if (space.status === 'maintenance' && getLeaseStatus(period, today) === 'active') {
    errors.spaceId = 'maintenance'
  }
  return errors
}

function periodAndRent(values: LeaseFormValues) {
  return {
    startDate: parseDisplayDate(values.startDate) ?? '',
    endDate: values.endDate.trim() ? parseDisplayDate(values.endDate) : null,
    monthlyRentCents: values.monthlyRent.trim() ? parseMonthlyRent(values.monthlyRent) : null,
  }
}

export function buildNewLease(values: LeaseFormValues, now: IsoDateTime, id: string = generateId()): Lease {
  return {
    id,
    tenantId: values.tenantId,
    spaceId: values.spaceId,
    ...periodAndRent(values),
    createdAt: now,
    updatedAt: now,
  }
}

/** Applies the editable fields: the period and the rent. Tenant and space stay the same. */
export function applyLeaseChanges(lease: Lease, values: LeaseFormValues, now: IsoDateTime): Lease {
  return { ...lease, ...periodAndRent(values), updatedAt: now }
}

export interface LeaseRow {
  lease: Lease
  status: LeaseStatus
  tenant: Tenant | null
  space: Space | null
  property: Property | null
}

export interface LeaseFilters {
  status: LeaseStatus | ''
  propertyId: string
  query: string
}

/** Joins leases with their tenant, space and property, newest start date first. */
export function buildLeaseRows(
  leases: Lease[],
  tenants: Tenant[],
  spaces: Space[],
  properties: Property[],
  today: IsoDate,
  locale: string,
): LeaseRow[] {
  const tenantsById = new Map(tenants.map((tenant) => [tenant.id, tenant]))
  const spacesById = new Map(spaces.map((space) => [space.id, space]))
  const propertiesById = new Map(properties.map((property) => [property.id, property]))
  const collator = new Intl.Collator(locale, { numeric: true })

  return leases
    .map((lease) => {
      const space = spacesById.get(lease.spaceId) ?? null
      return {
        lease,
        status: getLeaseStatus(lease, today),
        tenant: tenantsById.get(lease.tenantId) ?? null,
        space,
        property: space ? (propertiesById.get(space.propertyId) ?? null) : null,
      }
    })
    .toSorted(
      (a, b) =>
        b.lease.startDate.localeCompare(a.lease.startDate) ||
        collator.compare(a.tenant?.name ?? '', b.tenant?.name ?? ''),
    )
}

/** Filters rows; the search matches tenant and space names. */
export function filterLeaseRows(rows: LeaseRow[], filters: LeaseFilters, locale: string): LeaseRow[] {
  const query = filters.query.trim().toLocaleLowerCase(locale)
  return rows.filter(
    ({ status, tenant, space }) =>
      (!filters.status || status === filters.status) &&
      (!filters.propertyId || space?.propertyId === filters.propertyId) &&
      (!query ||
        [tenant?.name ?? '', space?.name ?? ''].some((text) =>
          text.toLocaleLowerCase(locale).includes(query),
        )),
  )
}
