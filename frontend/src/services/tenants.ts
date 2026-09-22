import type { IsoDate, IsoDateTime } from '../types/common'
import type { Lease } from '../types/lease'
import type { Property } from '../types/property'
import type { Space } from '../types/space'
import type { Tenant, TenantType } from '../types/tenant'
import { shiftIsoDate } from '../utils/date'
import { generateId } from '../utils/id'
import { getLeaseStatus } from './leases'

export const TENANT_TYPES: readonly TenantType[] = ['company', 'person']

export const TENANT_NAME_MAX_LENGTH = 100
export const TENANT_CONTACT_MAX_LENGTH = 100
export const TENANT_EMAIL_MAX_LENGTH = 254
export const TENANT_NOTES_MAX_LENGTH = 2000
export const TENANT_PHONE_MIN_LENGTH = 5
export const TENANT_PHONE_MAX_LENGTH = 20

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[\d\s()+-]+$/

export function isTenantType(value: string): value is TenantType {
  return (TENANT_TYPES as readonly string[]).includes(value)
}

export interface TenantFormValues {
  type: TenantType
  name: string
  /** Only used for companies. */
  contactPerson: string
  email: string
  phone: string
  notes: string
}

/** Error codes per field; the UI translates them (`tenants.form.validation.<field>.<code>`). */
export interface TenantFormErrors {
  type?: 'invalid'
  name?: 'required' | 'tooLong'
  contactPerson?: 'tooLong'
  email?: 'required' | 'invalid' | 'tooLong' | 'duplicate'
  phone?: 'invalid'
  notes?: 'tooLong'
}

export function emptyTenantForm(): TenantFormValues {
  return { type: 'company', name: '', contactPerson: '', email: '', phone: '', notes: '' }
}

export function toTenantForm(tenant: Tenant): TenantFormValues {
  return {
    type: tenant.type,
    name: tenant.name,
    contactPerson: tenant.contactPerson ?? '',
    email: tenant.email,
    phone: tenant.phone ?? '',
    notes: tenant.notes,
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

/**
 * Validates the form. `otherTenants` are used to keep emails unique
 * (ignoring case); `editingId` is the tenant being edited.
 */
export function validateTenantForm(
  values: TenantFormValues,
  otherTenants: Pick<Tenant, 'id' | 'email'>[],
  editingId?: string,
): TenantFormErrors {
  const errors: TenantFormErrors = {}
  const name = values.name.trim()
  const email = values.email.trim()
  const phone = values.phone.trim()

  if (!isTenantType(values.type)) errors.type = 'invalid'

  if (!name) errors.name = 'required'
  else if (name.length > TENANT_NAME_MAX_LENGTH) errors.name = 'tooLong'

  if (values.type === 'company' && values.contactPerson.trim().length > TENANT_CONTACT_MAX_LENGTH) {
    errors.contactPerson = 'tooLong'
  }

  if (!email) errors.email = 'required'
  else if (email.length > TENANT_EMAIL_MAX_LENGTH) errors.email = 'tooLong'
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'invalid'
  else if (
    otherTenants.some(
      (tenant) => tenant.id !== editingId && normalizeEmail(tenant.email) === normalizeEmail(email),
    )
  ) {
    errors.email = 'duplicate'
  }

  if (
    phone &&
    (!PHONE_PATTERN.test(phone) ||
      phone.length < TENANT_PHONE_MIN_LENGTH ||
      phone.length > TENANT_PHONE_MAX_LENGTH)
  ) {
    errors.phone = 'invalid'
  }

  if (values.notes.trim().length > TENANT_NOTES_MAX_LENGTH) errors.notes = 'tooLong'

  return errors
}

function normalize(values: TenantFormValues): Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'> {
  const contactPerson = values.contactPerson.trim()
  return {
    type: values.type,
    name: values.name.trim(),
    // A contact person only makes sense for a company.
    contactPerson: values.type === 'company' && contactPerson ? contactPerson : null,
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    notes: values.notes.trim(),
  }
}

export function buildNewTenant(
  values: TenantFormValues,
  now: IsoDateTime,
  id: string = generateId(),
): Tenant {
  return { id, ...normalize(values), createdAt: now, updatedAt: now }
}

export function applyTenantChanges(tenant: Tenant, values: TenantFormValues, now: IsoDateTime): Tenant {
  return { ...tenant, ...normalize(values), updatedAt: now }
}

/** A lease of the tenant, with its space and property for display. */
export interface TenantLease {
  lease: Lease
  space: Space | null
  property: Property | null
}

export interface TenantLeases {
  current: TenantLease[]
  upcoming: TenantLease[]
  past: TenantLease[]
}

/** Splits a tenant's leases by their status today: current and upcoming by start date, past newest first. */
export function groupTenantLeases(
  tenantId: string,
  leases: Lease[],
  spaces: Space[],
  properties: Property[],
  today: IsoDate,
): TenantLeases {
  const spacesById = new Map(spaces.map((space) => [space.id, space]))
  const propertiesById = new Map(properties.map((property) => [property.id, property]))
  const groups: TenantLeases = { current: [], upcoming: [], past: [] }

  for (const lease of leases) {
    if (lease.tenantId !== tenantId) continue
    const space = spacesById.get(lease.spaceId) ?? null
    const entry = {
      lease,
      space,
      property: space ? (propertiesById.get(space.propertyId) ?? null) : null,
    }
    const status = getLeaseStatus(lease, today)
    if (status === 'active') groups.current.push(entry)
    else if (status === 'upcoming') groups.upcoming.push(entry)
    else groups.past.push(entry)
  }

  const byStart = (a: TenantLease, b: TenantLease) => a.lease.startDate.localeCompare(b.lease.startDate)
  groups.current.sort(byStart)
  groups.upcoming.sort(byStart)
  groups.past.sort((a, b) => (b.lease.endDate ?? '').localeCompare(a.lease.endDate ?? ''))
  return groups
}

export interface TenantRow {
  tenant: Tenant
  current: TenantLease[]
  /** The earliest upcoming lease, shown when the tenant has no current space. */
  nextUpcoming: TenantLease | null
}

export interface TenantFilters {
  type: TenantType | ''
  query: string
}

/** Joins tenants with their current spaces, sorted by name. */
export function buildTenantRows(
  tenants: Tenant[],
  leases: Lease[],
  spaces: Space[],
  properties: Property[],
  today: IsoDate,
  locale: string,
): TenantRow[] {
  const collator = new Intl.Collator(locale, { numeric: true })
  return tenants
    .map((tenant) => {
      const groups = groupTenantLeases(tenant.id, leases, spaces, properties, today)
      return { tenant, current: groups.current, nextUpcoming: groups.upcoming[0] ?? null }
    })
    .toSorted((a, b) => collator.compare(a.tenant.name, b.tenant.name))
}

/** Filters rows; the search matches the name, contact person and email. */
export function filterTenantRows(rows: TenantRow[], filters: TenantFilters, locale: string): TenantRow[] {
  const query = filters.query.trim().toLocaleLowerCase(locale)
  return rows.filter(
    ({ tenant }) =>
      (!filters.type || tenant.type === filters.type) &&
      (!query ||
        [tenant.name, tenant.contactPerson ?? '', tenant.email].some((text) =>
          text.toLocaleLowerCase(locale).includes(query),
        )),
  )
}

export interface TenantDeletionCheck {
  allowed: boolean
  leaseCount: number
}

/** A tenant can only be deleted when no lease, current, upcoming or past, refers to it. */
export function checkTenantDeletion(tenantId: string, leases: Lease[]): TenantDeletionCheck {
  const leaseCount = leases.filter((lease) => lease.tenantId === tenantId).length
  return { allowed: leaseCount === 0, leaseCount }
}

/**
 * What removing a tenant from a space does to its lease: a lease that has
 * already run ends yesterday (the tenant has moved out), and a lease that
 * starts today or later has not run yet, so it is cancelled.
 */
export type RemovalPlan =
  | { action: 'end'; endDate: IsoDate }
  | { action: 'cancel' }
  | { action: 'none' }

export function planRemoval(lease: Lease, today: IsoDate): RemovalPlan {
  const status = getLeaseStatus(lease, today)
  if (status === 'ended') return { action: 'none' }
  if (lease.startDate >= today) return { action: 'cancel' }
  return { action: 'end', endDate: shiftIsoDate(today, { days: -1 }) }
}
