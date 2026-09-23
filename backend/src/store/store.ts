import type { Entity } from '../domain/common.ts'
import type { Property } from '../domain/properties.ts'
import type { Space } from '../domain/spaces.ts'

/**
 * Storage for one kind of entity. Asynchronous so the in-memory
 * implementation can be replaced by a database without changing the routes.
 */
export interface Collection<T extends Entity> {
  list(): Promise<T[]>
  get(id: string): Promise<T | null>
  insert(entity: T): Promise<T>
  /** Replaces a stored entity; `null` if it does not exist. */
  update(entity: T): Promise<T | null>
  /** `false` if the entity did not exist. */
  delete(id: string): Promise<boolean>
  /** Removes every entity, e.g. before restoring the demo data. */
  clear(): Promise<void>
}

/**
 * The part of a maintenance task that refers to a property and optionally a
 * space. It gets its full type when the maintenance endpoints are added.
 */
export interface MaintenanceReference extends Entity {
  propertyId: string
  spaceId: string | null
}

/** The part of a lease that refers to a space, until the lease endpoints are added. */
export interface LeaseReference extends Entity {
  spaceId: string
}

export interface Store {
  properties: Collection<Property>
  spaces: Collection<Space>
  maintenance: Collection<MaintenanceReference>
  leases: Collection<LeaseReference>
}
