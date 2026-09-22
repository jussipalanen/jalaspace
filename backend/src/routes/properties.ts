import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import {
  checkPropertyDeletion,
  parsePropertyInput,
  type Property,
  type PropertyInput,
} from '../domain/properties.ts'
import { ApiError } from '../errors.ts'
import type { Store } from '../store/store.ts'

/** Returns the checked input, or throws `400 validation_failed` with the field codes. */
function readInput(body: unknown): PropertyInput {
  const result = parsePropertyInput(body)
  if (!result.ok) throw new ApiError(400, 'validation_failed', { fields: result.errors })
  return result.values
}

/** `/api/properties`: list, read, create, update and delete properties. */
export function propertiesRouter(store: Store, now: () => Date = () => new Date()): Router {
  const router = Router()

  router.get('/properties', async (_request, response) => {
    response.json(await store.properties.list())
  })

  router.get('/properties/:id', async (request, response) => {
    const property = await store.properties.get(request.params.id)
    if (!property) throw new ApiError(404, 'not_found')
    response.json(property)
  })

  router.post('/properties', async (request, response) => {
    const input = readInput(request.body)
    const timestamp = now().toISOString()
    const property: Property = {
      id: randomUUID(),
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const created = await store.properties.insert(property)
    response.status(201).location(`/api/properties/${created.id}`).json(created)
  })

  router.put('/properties/:id', async (request, response) => {
    const existing = await store.properties.get(request.params.id)
    if (!existing) throw new ApiError(404, 'not_found')
    const input = readInput(request.body)
    const updated = await store.properties.update({
      ...existing,
      ...input,
      updatedAt: now().toISOString(),
    })
    if (!updated) throw new ApiError(404, 'not_found')
    response.json(updated)
  })

  router.delete('/properties/:id', async (request, response) => {
    const { id } = request.params
    if (!(await store.properties.get(id))) throw new ApiError(404, 'not_found')

    // Checked with the current data on every delete. A database version
    // should also enforce this with foreign keys inside a transaction.
    const [spaces, maintenance] = await Promise.all([store.spaces.list(), store.maintenance.list()])
    const check = checkPropertyDeletion(id, spaces, maintenance)
    if (!check.allowed) {
      throw new ApiError(409, 'property_in_use', {
        spaceCount: check.spaceCount,
        maintenanceCount: check.maintenanceCount,
      })
    }

    await store.properties.delete(id)
    response.status(204).end()
  })

  return router
}
