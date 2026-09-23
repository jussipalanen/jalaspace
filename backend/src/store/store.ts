import type { Entity } from '../domain/common.ts'
import type { MaintenanceTask } from '../domain/maintenance.ts'
import type { Property } from '../domain/properties.ts'
import type { Space } from '../domain/spaces.ts'
import type { Tenant } from '../domain/tenants.ts'

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

/** The part of a lease that refers to a tenant and a space, until the lease endpoints are added. */
export interface LeaseReference extends Entity {
  tenantId: string
  spaceId: string
}

export interface Store {
  properties: Collection<Property>
  spaces: Collection<Space>
  maintenance: Collection<MaintenanceTask>
  tenants: Collection<Tenant>
  leases: Collection<LeaseReference>
}
