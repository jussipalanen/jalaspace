import type { DataLayer } from '../repositories'
import { EntityNotFoundError } from '../repositories/Repository'
import type { IsoDate } from '../types/common'
import type { Lease } from '../types/lease'
import type { Property } from '../types/property'
import type { Space } from '../types/space'
import type { Tenant } from '../types/tenant'
import { toIsoDate } from '../utils/date'
import { hasErrors } from '../utils/validation'
import { getLeaseStatus } from './leases'
import { findActiveLease } from './spaces'
import {
  applyTenantChanges,
  buildAssignmentLease,
  buildNewTenant,
  checkTenantDeletion,
  groupTenantLeases,
  planRemoval,
  validateAssignmentForm,
  validateTenantForm,
  type AssignmentFormErrors,
  type AssignmentFormValues,
  type TenantDeletionCheck,
  type TenantFormErrors,
  type TenantFormValues,
  type TenantLeases,
} from './tenants'

type Repositories = Pick<DataLayer, 'properties' | 'spaces' | 'leases' | 'tenants'>

export class TenantValidationError extends Error {
  readonly errors: TenantFormErrors

  constructor(errors: TenantFormErrors) {
    super('Invalid tenant')
    this.name = 'TenantValidationError'
    this.errors = errors
  }
}

export class AssignmentValidationError extends Error {
  readonly errors: AssignmentFormErrors

  constructor(errors: AssignmentFormErrors) {
    super('Invalid space assignment')
    this.name = 'AssignmentValidationError'
    this.errors = errors
  }
}

export class TenantDeletionBlockedError extends Error {
  readonly check: TenantDeletionCheck

  constructor(check: TenantDeletionCheck) {
    super('Tenant still has leases')
    this.name = 'TenantDeletionBlockedError'
    this.check = check
  }
}

export interface TenantData {
  tenants: Tenant[]
  leases: Lease[]
  spaces: Space[]
  properties: Property[]
}

export async function loadTenantData(data: Repositories): Promise<TenantData> {
  const [tenants, leases, spaces, properties] = await Promise.all([
    data.tenants.getAll(),
    data.leases.getAll(),
    data.spaces.getAll(),
    data.properties.getAll(),
  ])
  return { tenants, leases, spaces, properties }
}

export interface TenantDetails {
  tenant: Tenant
  leases: TenantLeases
  deletion: TenantDeletionCheck
}

/** One tenant with its leases grouped by status; `null` if it does not exist. */
export function getTenantDetails(
  tenantData: TenantData,
  id: string,
  today: IsoDate,
): TenantDetails | null {
  const tenant = tenantData.tenants.find((item) => item.id === id)
  if (!tenant) return null
  return {
    tenant,
    leases: groupTenantLeases(id, tenantData.leases, tenantData.spaces, tenantData.properties, today),
    deletion: checkTenantDeletion(id, tenantData.leases),
  }
}

/** Re-check against current data, since another tab may have added the same email. */
async function validateForSave(data: Repositories, values: TenantFormValues, editingId?: string) {
  const errors = validateTenantForm(values, await data.tenants.getAll(), editingId)
  if (hasErrors(errors)) throw new TenantValidationError(errors)
}

export async function createTenant(
  data: Repositories,
  values: TenantFormValues,
  now: Date = new Date(),
): Promise<Tenant> {
  await validateForSave(data, values)
  return data.tenants.create(buildNewTenant(values, now.toISOString()))
}

export async function updateTenant(
  data: Repositories,
  id: string,
  values: TenantFormValues,
  now: Date = new Date(),
): Promise<Tenant> {
  const existing = await data.tenants.getById(id)
  if (!existing) throw new EntityNotFoundError(id)
  await validateForSave(data, values, id)
  return data.tenants.update(applyTenantChanges(existing, values, now.toISOString()))
}

/** Deletes a tenant after re-checking, with current data, that no lease refers to it. */
export async function deleteTenant(data: Repositories, id: string): Promise<void> {
  const check = checkTenantDeletion(id, await data.leases.getAll())
  if (!check.allowed) throw new TenantDeletionBlockedError(check)
  await data.tenants.delete(id)
}

/**
 * Assigns a tenant to a space with a new open-ended lease. When the lease is
 * active today, the space becomes occupied; an upcoming lease leaves it available.
 */
export async function assignTenantToSpace(
  data: Repositories,
  tenantId: string,
  values: AssignmentFormValues,
  now: Date = new Date(),
): Promise<{ lease: Lease; space: Space }> {
  const [tenant, properties, spaces, leases] = await Promise.all([
    data.tenants.getById(tenantId),
    data.properties.getAll(),
    data.spaces.getAll(),
    data.leases.getAll(),
  ])
  if (!tenant) throw new EntityNotFoundError(tenantId)
  const errors = validateAssignmentForm(values, properties, spaces, leases)
  if (hasErrors(errors)) throw new AssignmentValidationError(errors)

  const timestamp = now.toISOString()
  const lease = await data.leases.create(buildAssignmentLease(tenantId, values, timestamp))
  let space = spaces.find((item) => item.id === lease.spaceId)!
  if (getLeaseStatus(lease, toIsoDate(now)) === 'active') {
    space = await data.spaces.update({ ...space, status: 'occupied', updatedAt: timestamp })
  }
  return { lease, space }
}

/**
 * Removes a tenant from a space: ends a running lease yesterday or cancels one
 * that has not started, then frees the space if no other lease keeps it occupied.
 */
export async function removeTenantFromSpace(
  data: Repositories,
  leaseId: string,
  now: Date = new Date(),
): Promise<{ action: 'end' | 'cancel' }> {
  const lease = await data.leases.getById(leaseId)
  if (!lease) throw new EntityNotFoundError(leaseId)
  const today = toIsoDate(now)
  const plan = planRemoval(lease, today)
  if (plan.action === 'none') throw new EntityNotFoundError(leaseId)

  const timestamp = now.toISOString()
  if (plan.action === 'end') {
    await data.leases.update({ ...lease, endDate: plan.endDate, updatedAt: timestamp })
  } else {
    await data.leases.delete(lease.id)
  }

  const [space, leases] = await Promise.all([data.spaces.getById(lease.spaceId), data.leases.getAll()])
  if (space?.status === 'occupied' && !findActiveLease(space.id, leases, today)) {
    await data.spaces.update({ ...space, status: 'available', updatedAt: timestamp })
  }
  return { action: plan.action }
}
