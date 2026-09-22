import type { DataLayer } from '../repositories'
import { EntityNotFoundError } from '../repositories/Repository'
import type { Lease } from '../types/lease'
import type { Property } from '../types/property'
import type { Space } from '../types/space'
import type { Tenant } from '../types/tenant'
import { toIsoDate } from '../utils/date'
import { hasErrors } from '../utils/validation'
import {
  applyLeaseChanges,
  buildNewLease,
  validateLeaseForm,
  type LeaseFormErrors,
  type LeaseFormValues,
} from './leases'
import { reconcileSpaceStatuses } from './spaces'

type Repositories = Pick<DataLayer, 'properties' | 'spaces' | 'leases' | 'tenants'>

export class LeaseValidationError extends Error {
  readonly errors: LeaseFormErrors

  constructor(errors: LeaseFormErrors) {
    super('Invalid lease')
    this.name = 'LeaseValidationError'
    this.errors = errors
  }
}

export interface LeaseData {
  leases: Lease[]
  tenants: Tenant[]
  spaces: Space[]
  properties: Property[]
}

export async function loadLeaseData(data: Repositories): Promise<LeaseData> {
  const [leases, tenants, spaces, properties] = await Promise.all([
    data.leases.getAll(),
    data.tenants.getAll(),
    data.spaces.getAll(),
    data.properties.getAll(),
  ])
  return { leases, tenants, spaces, properties }
}

/**
 * Brings the stored status of one space in line with its leases today:
 * occupied while a lease is active, otherwise not occupied.
 */
export async function syncSpaceStatus(
  data: Pick<DataLayer, 'spaces' | 'leases'>,
  spaceId: string,
  now: Date = new Date(),
): Promise<Space | null> {
  const [space, leases] = await Promise.all([data.spaces.getById(spaceId), data.leases.getAll()])
  if (!space) return null
  const [changed] = reconcileSpaceStatuses([space], leases, toIsoDate(now))
  return changed ? data.spaces.update({ ...changed, updatedAt: now.toISOString() }) : space
}

/**
 * Brings every space status in line with its leases today. Run on app start,
 * because a lease may have started or ended since the last visit.
 * Returns the number of spaces that changed.
 */
export async function syncAllSpaceStatuses(
  data: Pick<DataLayer, 'spaces' | 'leases'>,
  now: Date = new Date(),
): Promise<number> {
  const [spaces, leases] = await Promise.all([data.spaces.getAll(), data.leases.getAll()])
  const changed = reconcileSpaceStatuses(spaces, leases, toIsoDate(now))
  const timestamp = now.toISOString()
  for (const space of changed) await data.spaces.update({ ...space, updatedAt: timestamp })
  return changed.length
}

/** Re-check against current data, since another tab may have added a lease for the space. */
async function validateForSave(
  data: Repositories,
  values: LeaseFormValues,
  now: Date,
  editingId?: string,
) {
  const { leases, tenants, spaces, properties } = await loadLeaseData(data)
  const errors = validateLeaseForm(values, {
    tenants,
    properties,
    spaces,
    leases,
    today: toIsoDate(now),
    editingId,
  })
  if (hasErrors(errors)) throw new LeaseValidationError(errors)
}

/** Creates a lease and updates the space status: a lease active today makes the space occupied. */
export async function createLease(
  data: Repositories,
  values: LeaseFormValues,
  now: Date = new Date(),
): Promise<Lease> {
  await validateForSave(data, values, now)
  const lease = await data.leases.create(buildNewLease(values, now.toISOString()))
  await syncSpaceStatus(data, lease.spaceId, now)
  return lease
}

/**
 * Updates the period and rent of a lease, then the space status: e.g. an end
 * date in the past frees the space, and a future end date keeps it occupied.
 */
export async function updateLease(
  data: Repositories,
  id: string,
  values: LeaseFormValues,
  now: Date = new Date(),
): Promise<Lease> {
  const existing = await data.leases.getById(id)
  if (!existing) throw new EntityNotFoundError(id)
  // Tenant and space cannot change, so validate with the stored ones.
  await validateForSave(data, { ...values, tenantId: existing.tenantId, spaceId: existing.spaceId }, now, id)
  const lease = await data.leases.update(applyLeaseChanges(existing, values, now.toISOString()))
  await syncSpaceStatus(data, lease.spaceId, now)
  return lease
}
