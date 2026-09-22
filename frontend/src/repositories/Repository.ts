import type { Entity } from '../types/common'
import type { Lease } from '../types/lease'
import type { MaintenanceTask } from '../types/maintenance'
import type { Property } from '../types/property'
import type { Space } from '../types/space'
import type { Tenant } from '../types/tenant'

/**
 * Persistence contract used by the UI layer. Implementations may store data
 * locally (localStorage) or call a REST API; callers must not depend on which.
 */
export interface Repository<T extends Entity> {
  getAll(): Promise<T[]>
  getById(id: string): Promise<T | null>
  /** Stores a new entity. Rejects with `DuplicateEntityError` if the id exists. */
  create(entity: T): Promise<T>
  /** Replaces an existing entity. Rejects with `EntityNotFoundError` if it does not exist. */
  update(entity: T): Promise<T>
  /** Removes an entity. Deleting a missing id is a no-op. */
  delete(id: string): Promise<void>
}

export type PropertyRepository = Repository<Property>
export type SpaceRepository = Repository<Space>
export type TenantRepository = Repository<Tenant>
export type LeaseRepository = Repository<Lease>
export type MaintenanceRepository = Repository<MaintenanceTask>

export class EntityNotFoundError extends Error {
  constructor(id: string) {
    super(`Entity "${id}" was not found`)
    this.name = 'EntityNotFoundError'
  }
}

export class DuplicateEntityError extends Error {
  constructor(id: string) {
    super(`Entity "${id}" already exists`)
    this.name = 'DuplicateEntityError'
  }
}
