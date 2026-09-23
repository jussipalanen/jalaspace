import { Router, type RequestHandler } from 'express'
import { RateLimiter } from './ai/rateLimit.ts'
import { ApiError } from './errors.ts'
import type { Collection, Store } from './store/store.ts'

// The API is public and keeps its data in memory, so it limits how fast one
// client can change data and how much data can be stored in total.

/** Default writes (POST, PUT, DELETE) per client and minute. */
export const DEFAULT_WRITE_RATE_LIMIT = 60
/** Default demo resets per client and hour; a reset undoes everyone's changes. */
export const DEFAULT_RESET_RATE_LIMIT = 10

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS

export const createWriteRateLimiter = (perMinute = DEFAULT_WRITE_RATE_LIMIT) =>
  new RateLimiter({ limit: perMinute, windowMs: MINUTE_MS })

export const createResetRateLimiter = (perHour = DEFAULT_RESET_RATE_LIMIT) =>
  new RateLimiter({ limit: perHour, windowMs: HOUR_MS })

/** Maximum stored records per collection, far above the demo data (4, 68, 14, 31 and 62). */
export interface CollectionLimits {
  properties: number
  spaces: number
  maintenance: number
  tenants: number
  leases: number
}

export const DEFAULT_COLLECTION_LIMITS: CollectionLimits = {
  properties: 50,
  spaces: 500,
  maintenance: 500,
  tenants: 300,
  leases: 1000,
}

/** Counts a request against `limiter`, or throws `429 rate_limited` with `Retry-After`. */
function limitWith(limiter: RateLimiter): RequestHandler {
  return (request, response, next) => {
    // `request.ip` is the client, not Render's proxy, when `trust proxy` is set.
    const result = limiter.hit(request.ip ?? 'unknown')
    if (!result.allowed) {
      response.set('Retry-After', String(result.retryAfterSeconds))
      throw new ApiError(429, 'rate_limited')
    }
    next()
  }
}

const WRITE_METHODS = new Set(['POST', 'PUT', 'DELETE'])

/**
 * Limits writes per client. AI suggestions are skipped: they change nothing
 * and have their own, stricter limit.
 */
export function writeRateLimit(limiter: RateLimiter): RequestHandler {
  const limit = limitWith(limiter)
  return (request, response, next) => {
    if (!WRITE_METHODS.has(request.method) || request.path === '/maintenance/suggestions') {
      next()
      return
    }
    limit(request, response, next)
  }
}

/** Limits `POST /demo/reset` per client, on top of the write limit. */
export function resetRateLimit(limiter: RateLimiter): Router {
  const router = Router()
  router.post('/demo/reset', limitWith(limiter))
  return router
}

/**
 * Refuses to create a record when its collection is full: `409 limit_reached`
 * with the limit. Updates and deletes still work, so a full collection can be
 * cleaned up. Mounted before the resource routers.
 */
export function collectionLimits(store: Store, limits: CollectionLimits): Router {
  const router = Router()
  const guard = (collection: Collection<{ id: string; createdAt: string; updatedAt: string }>, limit: number) =>
    (async (_request, _response, next) => {
      if ((await collection.list()).length >= limit) throw new ApiError(409, 'limit_reached', { limit })
      next()
    }) satisfies RequestHandler

  router.post('/properties', guard(store.properties, limits.properties))
  router.post('/units', guard(store.spaces, limits.spaces))
  router.post('/maintenance', guard(store.maintenance, limits.maintenance))
  router.post('/tenants', guard(store.tenants, limits.tenants))
  router.post('/leases', guard(store.leases, limits.leases))
  return router
}
