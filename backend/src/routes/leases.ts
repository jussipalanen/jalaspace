import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { isRecord } from '../domain/common.ts'
import {
  checkLeaseReferences,
  parseLeaseInput,
  syncSpaceStatuses,
  toIsoDate,
  type Lease,
  type LeaseInput,
} from '../domain/leases.ts'
import { ApiError } from '../errors.ts'
import type { Store } from '../store/store.ts'

/**
 * Returns the checked input, or throws `400 validation_failed` with the field
 * codes. The tenant, space and overlapping leases are checked with the current
 * data on every save. An update keeps the stored tenant and space.
 */
async function readInput(store: Store, body: unknown, today: string, existing?: Lease): Promise<LeaseInput> {
  // Tenant and space are fixed once a lease exists, as in the app.
  const source = existing
    ? { ...(isRecord(body) ? body : {}), tenantId: existing.tenantId, spaceId: existing.spaceId }
    : body
  const result = parseLeaseInput(source)
  if (!result.ok) throw new ApiError(400, 'validation_failed', { fields: result.errors })

  const input = result.values
  const [tenant, space, leases] = await Promise.all([
    store.tenants.get(input.tenantId),
    store.spaces.get(input.spaceId),
    store.leases.list(),
  ])
  const errors = checkLeaseReferences(input, {
    tenantExists: tenant !== null,
    space,
    leases,
    today,
    editingId: existing?.id,
  })
  if (Object.keys(errors).length > 0) throw new ApiError(400, 'validation_failed', { fields: errors })
  return input
}

/**
 * `/api/leases`: list, read, create, update and delete leases. After every
 * change the lease's space is occupied exactly when it has an active lease.
 */
export function leasesRouter(store: Store, now: () => Date = () => new Date()): Router {
  const router = Router()

  router.get('/leases', async (_request, response) => {
    response.json(await store.leases.list())
  })

  router.get('/leases/:id', async (request, response) => {
    const lease = await store.leases.get(request.params.id)
    if (!lease) throw new ApiError(404, 'not_found')
    response.json(lease)
  })

  router.post('/leases', async (request, response) => {
    const time = now()
    const input = await readInput(store, request.body, toIsoDate(time))
    const timestamp = time.toISOString()
    const lease: Lease = { id: randomUUID(), ...input, createdAt: timestamp, updatedAt: timestamp }
    const created = await store.leases.insert(lease)
    await syncSpaceStatuses(store, time, [created.spaceId])
    response.status(201).location(`/api/leases/${created.id}`).json(created)
  })

  router.put('/leases/:id', async (request, response) => {
    const existing = await store.leases.get(request.params.id)
    if (!existing) throw new ApiError(404, 'not_found')
    const time = now()
    const input = await readInput(store, request.body, toIsoDate(time), existing)
    const updated = await store.leases.update({ ...existing, ...input, updatedAt: time.toISOString() })
    if (!updated) throw new ApiError(404, 'not_found')
    // E.g. an end date in the past frees the space.
    await syncSpaceStatuses(store, time, [updated.spaceId])
    response.json(updated)
  })

  // Nothing refers to a lease, so it can always be deleted, e.g. to cancel one
  // that has not started.
  router.delete('/leases/:id', async (request, response) => {
    const lease = await store.leases.get(request.params.id)
    if (!lease) throw new ApiError(404, 'not_found')
    await store.leases.delete(lease.id)
    await syncSpaceStatuses(store, now(), [lease.spaceId])
    response.status(204).end()
  })

  return router
}
