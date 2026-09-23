import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import {
  checkMaintenanceReferences,
  parseMaintenanceInput,
  resolveCompletedAt,
  type MaintenanceInput,
  type MaintenanceTask,
} from '../domain/maintenance.ts'
import { ApiError } from '../errors.ts'
import type { Store } from '../store/store.ts'

/**
 * Returns the checked input, or throws `400 validation_failed` with the field
 * codes. The property and space are checked with the current data on every save.
 */
async function readInput(store: Store, body: unknown): Promise<MaintenanceInput> {
  const result = parseMaintenanceInput(body)
  if (!result.ok) throw new ApiError(400, 'validation_failed', { fields: result.errors })

  const input = result.values
  const [property, spaces] = await Promise.all([store.properties.get(input.propertyId), store.spaces.list()])
  const errors = checkMaintenanceReferences(input, { propertyExists: property !== null, spaces })
  if (Object.keys(errors).length > 0) throw new ApiError(400, 'validation_failed', { fields: errors })
  return input
}

/**
 * `/api/maintenance`: list, read, create, update and delete maintenance tasks.
 * A status change is an update; the server keeps `completedAt` in step.
 */
export function maintenanceRouter(store: Store, now: () => Date = () => new Date()): Router {
  const router = Router()

  router.get('/maintenance', async (_request, response) => {
    response.json(await store.maintenance.list())
  })

  router.get('/maintenance/:id', async (request, response) => {
    const task = await store.maintenance.get(request.params.id)
    if (!task) throw new ApiError(404, 'not_found')
    response.json(task)
  })

  router.post('/maintenance', async (request, response) => {
    const input = await readInput(store, request.body)
    const timestamp = now().toISOString()
    const task: MaintenanceTask = {
      id: randomUUID(),
      ...input,
      completedAt: resolveCompletedAt(input.status, null, timestamp),
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const created = await store.maintenance.insert(task)
    response.status(201).location(`/api/maintenance/${created.id}`).json(created)
  })

  router.put('/maintenance/:id', async (request, response) => {
    const existing = await store.maintenance.get(request.params.id)
    if (!existing) throw new ApiError(404, 'not_found')
    const input = await readInput(store, request.body)
    const timestamp = now().toISOString()
    const updated = await store.maintenance.update({
      ...existing,
      ...input,
      completedAt: resolveCompletedAt(input.status, existing, timestamp),
      updatedAt: timestamp,
    })
    if (!updated) throw new ApiError(404, 'not_found')
    response.json(updated)
  })

  // Nothing refers to a maintenance task, so it can always be deleted.
  router.delete('/maintenance/:id', async (request, response) => {
    if (!(await store.maintenance.delete(request.params.id))) throw new ApiError(404, 'not_found')
    response.status(204).end()
  })

  return router
}
