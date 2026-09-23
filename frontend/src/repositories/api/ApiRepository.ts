import type { Entity } from '../../types/common'
import { EntityNotFoundError, type Repository } from '../Repository'
import { apiRequest, ApiRequestError } from './apiRequest'

function isEntityLike(value: unknown): value is Entity {
  return typeof value === 'object' && value !== null && typeof (value as { id?: unknown }).id === 'string'
}

function asEntity<T extends Entity>(value: unknown): T {
  if (!isEntityLike(value)) throw new ApiRequestError(null, 'unexpected_response')
  return value as T
}

const isNotFound = (error: unknown) => error instanceof ApiRequestError && error.status === 404

/**
 * Stores a collection through the JalaSpace REST API, e.g. `/api/properties`.
 * The API assigns ids and timestamps and checks the business rules again, so
 * callers use the entity it returns rather than the one they sent.
 */
export class ApiRepository<T extends Entity> implements Repository<T> {
  private readonly baseUrl: string
  private readonly path: string

  /** `path` is the collection under `/api`, e.g. `/units`. */
  constructor(baseUrl: string, path: string) {
    this.baseUrl = baseUrl
    this.path = path
  }

  async getAll(): Promise<T[]> {
    const body = await apiRequest(this.baseUrl, 'GET', this.path)
    if (!Array.isArray(body)) throw new ApiRequestError(null, 'unexpected_response')
    return body.filter(isEntityLike) as T[]
  }

  async getById(id: string): Promise<T | null> {
    try {
      return asEntity<T>(await apiRequest(this.baseUrl, 'GET', this.itemPath(id)))
    } catch (error) {
      if (isNotFound(error)) return null
      throw error
    }
  }

  /** The API ignores the client's id and timestamps; the returned entity has the stored ones. */
  async create(entity: T): Promise<T> {
    return asEntity<T>(await apiRequest(this.baseUrl, 'POST', this.path, entity))
  }

  async update(entity: T): Promise<T> {
    try {
      return asEntity<T>(await apiRequest(this.baseUrl, 'PUT', this.itemPath(entity.id), entity))
    } catch (error) {
      if (isNotFound(error)) throw new EntityNotFoundError(entity.id)
      throw error
    }
  }

  /** Deleting a missing id is a no-op, as in the other repositories. */
  async delete(id: string): Promise<void> {
    try {
      await apiRequest(this.baseUrl, 'DELETE', this.itemPath(id))
    } catch (error) {
      if (!isNotFound(error)) throw error
    }
  }

  private itemPath(id: string): string {
    return `${this.path}/${encodeURIComponent(id)}`
  }
}
