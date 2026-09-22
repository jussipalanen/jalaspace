import type { Entity } from '../domain/common.ts'
import type { Collection, Store } from './store.ts'

/**
 * Keeps entities in memory, in insertion order. Data is lost when the server
 * restarts, which is fine for the demo until a database is added.
 */
export class MemoryCollection<T extends Entity> implements Collection<T> {
  readonly #items = new Map<string, T>()

  // Copies in and out, so callers cannot change stored data by accident.
  async list(): Promise<T[]> {
    return [...this.#items.values()].map((item) => structuredClone(item))
  }

  async get(id: string): Promise<T | null> {
    const item = this.#items.get(id)
    return item ? structuredClone(item) : null
  }

  async insert(entity: T): Promise<T> {
    if (this.#items.has(entity.id)) throw new Error(`Duplicate id ${entity.id}`)
    this.#items.set(entity.id, structuredClone(entity))
    return structuredClone(entity)
  }

  async update(entity: T): Promise<T | null> {
    if (!this.#items.has(entity.id)) return null
    this.#items.set(entity.id, structuredClone(entity))
    return structuredClone(entity)
  }

  async delete(id: string): Promise<boolean> {
    return this.#items.delete(id)
  }

  async clear(): Promise<void> {
    this.#items.clear()
  }
}

export function createMemoryStore(): Store {
  return {
    properties: new MemoryCollection(),
    spaces: new MemoryCollection(),
    maintenance: new MemoryCollection(),
  }
}
