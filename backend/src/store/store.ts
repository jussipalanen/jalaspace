import type { Entity } from '../domain/common.ts'
import type { Property } from '../domain/properties.ts'

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
}

/**
 * The part of a space or maintenance task that refers to a property. They get
 * their full types when their own endpoints are added.
 */
export interface PropertyReference extends Entity {
  propertyId: string
}

export interface Store {
  properties: Collection<Property>
  spaces: Collection<PropertyReference>
  maintenance: Collection<PropertyReference>
}
