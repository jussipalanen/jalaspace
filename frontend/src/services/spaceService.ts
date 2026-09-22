import type { DataLayer } from '../repositories'
import { EntityNotFoundError } from '../repositories/Repository'
import type { IsoDate } from '../types/common'
import type { Lease } from '../types/lease'
import type { MaintenanceTask } from '../types/maintenance'
import type { Property } from '../types/property'
import type { Space } from '../types/space'
import type { Tenant } from '../types/tenant'
import { toIsoDate } from '../utils/date'
import { hasErrors } from '../utils/validation'
import {
  applySpaceChanges,
  buildNewSpace,
  checkSpaceDeletion,
  findActiveLease,
  validateSpaceForm,
  type SpaceDeletionCheck,
  type SpaceFormErrors,
  type SpaceFormValues,
} from './spaces'

type Repositories = Pick<DataLayer, 'properties' | 'spaces' | 'leases' | 'tenants' | 'maintenance'>

export class SpaceValidationError extends Error {
  readonly errors: SpaceFormErrors

  constructor(errors: SpaceFormErrors) {
    super('Invalid space')
    this.name = 'SpaceValidationError'
    this.errors = errors
  }
}

/** Re-check against current data, since the form may have been open in another tab. */
async function validateForSave(data: Repositories, values: SpaceFormValues, editingId?: string) {
  const [property, spaces] = await Promise.all([
    data.properties.getById(values.propertyId),
    data.spaces.getAll(),
  ])
  const errors = validateSpaceForm(values, spaces, editingId)
  if (values.propertyId && !property) errors.propertyId = 'notFound'
  if (hasErrors(errors)) throw new SpaceValidationError(errors)
}

export class SpaceDeletionBlockedError extends Error {
  readonly check: SpaceDeletionCheck

  constructor(check: SpaceDeletionCheck) {
    super('Space still has leases or maintenance tasks')
    this.name = 'SpaceDeletionBlockedError'
    this.check = check
  }
}

export interface SpaceData {
  properties: Property[]
  spaces: Space[]
  leases: Lease[]
  tenants: Tenant[]
  maintenance: MaintenanceTask[]
}

export async function loadSpaceData(data: Repositories): Promise<SpaceData> {
  const [properties, spaces, leases, tenants, maintenance] = await Promise.all([
    data.properties.getAll(),
    data.spaces.getAll(),
    data.leases.getAll(),
    data.tenants.getAll(),
    data.maintenance.getAll(),
  ])
  return { properties, spaces, leases, tenants, maintenance }
}

export interface SpaceEditContext {
  space: Space
  activeLease: Lease | null
  tenant: Tenant | null
  deletion: SpaceDeletionCheck
}

/** Everything the edit page needs about one space; `null` if it does not exist. */
export function getSpaceEditContext(
  spaceData: SpaceData,
  id: string,
  today: IsoDate,
): SpaceEditContext | null {
  const space = spaceData.spaces.find((item) => item.id === id)
  if (!space) return null
  const activeLease = findActiveLease(id, spaceData.leases, today)
  return {
    space,
    activeLease,
    tenant: activeLease
      ? (spaceData.tenants.find((tenant) => tenant.id === activeLease.tenantId) ?? null)
      : null,
    deletion: checkSpaceDeletion(id, spaceData.leases, spaceData.maintenance),
  }
}

export async function createSpace(
  data: Repositories,
  values: SpaceFormValues,
  now: Date = new Date(),
): Promise<Space> {
  await validateForSave(data, values)
  return data.spaces.create(buildNewSpace(values, now.toISOString()))
}

/** Updates a space; the status follows the current leases, whatever the form says. */
export async function updateSpace(
  data: Repositories,
  id: string,
  values: SpaceFormValues,
  now: Date = new Date(),
): Promise<Space> {
  const [existing, leases] = await Promise.all([data.spaces.getById(id), data.leases.getAll()])
  if (!existing) throw new EntityNotFoundError(id)
  await validateForSave(data, values, id)
  if (existing.propertyId !== values.propertyId) {
    const maintenance = await data.maintenance.getAll()
    // Tasks refer to both a property and a space; moving only the space would
    // leave those references inconsistent. Task reassignment is a separate flow.
    if (maintenance.some((task) => task.spaceId === id)) {
      throw new SpaceValidationError({ propertyId: 'maintenanceLinked' })
    }
  }
  const hasActiveLease = findActiveLease(id, leases, toIsoDate(now)) !== null
  return data.spaces.update(applySpaceChanges(existing, values, hasActiveLease, now.toISOString()))
}

/** Deletes a space after re-checking, with current data, that nothing refers to it. */
export async function deleteSpace(data: Repositories, id: string): Promise<void> {
  const [leases, maintenance] = await Promise.all([data.leases.getAll(), data.maintenance.getAll()])
  const check = checkSpaceDeletion(id, leases, maintenance)
  if (!check.allowed) throw new SpaceDeletionBlockedError(check)
  await data.spaces.delete(id)
}
