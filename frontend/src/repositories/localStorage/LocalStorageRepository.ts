import type { Entity } from '../../types/common'
import { DuplicateEntityError, EntityNotFoundError, type Repository } from '../Repository'
import { readJson, writeJson } from './storage'

function isEntityLike(value: unknown): value is Entity {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { id?: unknown }).id === 'string'
  )
}

/**
 * Stores a collection as a JSON array under one localStorage key.
 * Missing or corrupt data reads as an empty collection instead of throwing.
 */
export class LocalStorageRepository<T extends Entity> implements Repository<T> {
  private readonly key: string

  constructor(key: string) {
    this.key = key
  }

  async getAll(): Promise<T[]> {
    return this.read()
  }

  async getById(id: string): Promise<T | null> {
    return this.read().find((entity) => entity.id === id) ?? null
  }

  async create(entity: T): Promise<T> {
    const entities = this.read()
    if (entities.some((existing) => existing.id === entity.id)) {
      throw new DuplicateEntityError(entity.id)
    }
    this.write([...entities, entity])
    return entity
  }

  async update(entity: T): Promise<T> {
    const entities = this.read()
    const index = entities.findIndex((existing) => existing.id === entity.id)
    if (index === -1) throw new EntityNotFoundError(entity.id)

    this.write(entities.with(index, entity))
    return entity
  }

  async delete(id: string): Promise<void> {
    const entities = this.read()
    const remaining = entities.filter((entity) => entity.id !== id)
    if (remaining.length !== entities.length) this.write(remaining)
  }

  private read(): T[] {
    const value = readJson(this.key)
    if (value === null) return []
    if (!Array.isArray(value)) {
      if (import.meta.env.DEV) console.warn(`Ignoring invalid data in "${this.key}"`)
      return []
    }
    // Only a shallow shape check: data is written by this app, so full
    // schema validation is left to the future API boundary.
    return value.filter(isEntityLike) as T[]
  }

  private write(entities: T[]): void {
    writeJson(this.key, entities)
  }
}
