import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import {
  checkSpaceDeletion,
  checkSpaceReferences,
  parseSpaceInput,
  resolveSpaceStatus,
  type Space,
  type SpaceInput,
} from '../domain/spaces.ts'
import { hasActiveLease, syncSpaceStatuses, toIsoDate } from '../domain/leases.ts'
import { ApiError } from '../errors.ts'
import type { Store } from '../store/store.ts'

/**
 * Returns the checked input, or throws `400 validation_failed` with the field
 * codes. The references are checked with the current data on every save.
 */
async function readInput(store: Store, body: unknown, existing?: Space): Promise<SpaceInput> {
  const result = parseSpaceInput(body)
  if (!result.ok) throw new ApiError(400, 'validation_failed', { fields: result.errors })

  const input = result.values
  const [property, spaces, maintenance] = await Promise.all([
    store.properties.get(input.propertyId),
    store.spaces.list(),
    store.maintenance.list(),
  ])
  const errors = checkSpaceReferences(input, { propertyExists: property !== null, spaces, maintenance, existing })
  if (Object.keys(errors).length > 0) throw new ApiError(400, 'validation_failed', { fields: errors })
  return input
}

/**
 * `/api/units`: list, read, create, update and delete spaces. The path follows
 * the app route (`/units`); the entity is called a space.
 */
export function spacesRouter(store: Store, now: () => Date = () => new Date()): Router {
  const router = Router()

  router.get('/units', async (_request, response) => {
    // Leases start and end as days pass, so statuses are brought up to date first.
    await syncSpaceStatuses(store, now())
    response.json(await store.spaces.list())
  })

  router.get('/units/:id', async (request, response) => {
    await syncSpaceStatuses(store, now(), [request.params.id])
    const space = await store.spaces.get(request.params.id)
    if (!space) throw new ApiError(404, 'not_found')
    response.json(space)
  })

  router.post('/units', async (request, response) => {
    const input = await readInput(store, request.body)
    const timestamp = now().toISOString()
    const space: Space = {
      id: randomUUID(),
      ...input,
      // A new space has no leases yet, so it cannot be occupied.
      status: resolveSpaceStatus(input.status, false),
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const created = await store.spaces.insert(space)
    response.status(201).location(`/api/units/${created.id}`).json(created)
  })

  router.put('/units/:id', async (request, response) => {
    const existing = await store.spaces.get(request.params.id)
    if (!existing) throw new ApiError(404, 'not_found')
    const input = await readInput(store, request.body, existing)
    // The status follows the leases, whatever the client sends.
    const time = now()
    const occupied = hasActiveLease(existing.id, await store.leases.list(), toIsoDate(time))
    const updated = await store.spaces.update({
      ...existing,
      ...input,
      status: resolveSpaceStatus(input.status, occupied),
      updatedAt: time.toISOString(),
    })
    if (!updated) throw new ApiError(404, 'not_found')
    response.json(updated)
  })

  router.delete('/units/:id', async (request, response) => {
    const { id } = request.params
    if (!(await store.spaces.get(id))) throw new ApiError(404, 'not_found')

    // Checked with the current data on every delete, like properties.
    const [leases, maintenance] = await Promise.all([store.leases.list(), store.maintenance.list()])
    const check = checkSpaceDeletion(id, leases, maintenance)
    if (!check.allowed) {
      throw new ApiError(409, 'space_in_use', {
        leaseCount: check.leaseCount,
        maintenanceCount: check.maintenanceCount,
      })
    }

    await store.spaces.delete(id)
    response.status(204).end()
  })

  return router
}
