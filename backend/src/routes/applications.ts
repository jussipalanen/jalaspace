import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import {
  canChangeApplicationStatus,
  checkApplicationReferences,
  checkNewApplication,
  isSpaceOpenForApplications,
  parseApplicationInput,
  resolveDecidedAt,
  type Application,
  type ApplicationInput,
} from '../domain/applications.ts'
import { toIsoDate } from '../domain/leases.ts'
import { ApiError } from '../errors.ts'
import type { Store } from '../store/store.ts'

/**
 * Returns the checked input, or throws `400 validation_failed` with the field
 * codes. The space and tenant are checked with the current data on every save.
 */
async function readInput(store: Store, body: unknown): Promise<ApplicationInput> {
  const result = parseApplicationInput(body)
  if (!result.ok) throw new ApiError(400, 'validation_failed', { fields: result.errors })

  const input = result.values
  const [space, tenant] = await Promise.all([
    store.spaces.get(input.spaceId),
    input.tenantId === null ? null : store.tenants.get(input.tenantId),
  ])
  const errors = checkApplicationReferences(input, { spaceExists: space !== null, tenantExists: tenant !== null })
  if (Object.keys(errors).length > 0) throw new ApiError(400, 'validation_failed', { fields: errors })
  return input
}

// Applications contain the applicant's personal details, so nothing about a
// request body is ever logged here.

/**
 * `/api/applications`: list, read, create, update and delete rental
 * applications. A status change is an update; the server keeps `decidedAt`
 * in step and refuses changes the status rules do not allow.
 */
export function applicationsRouter(store: Store, now: () => Date = () => new Date()): Router {
  const router = Router()

  router.get('/applications', async (_request, response) => {
    response.json(await store.applications.list())
  })

  router.get('/applications/:id', async (request, response) => {
    const application = await store.applications.get(request.params.id)
    if (!application) throw new ApiError(404, 'not_found')
    response.json(application)
  })

  router.post('/applications', async (request, response) => {
    // A new application always waits for a decision, whatever the client sends.
    const input = await readInput(store, {
      ...(typeof request.body === 'object' && request.body !== null ? request.body : {}),
      status: 'submitted',
      tenantId: null,
    })
    const time = now()
    const today = toIsoDate(time)
    const [applications, space, leases] = await Promise.all([
      store.applications.list(),
      store.spaces.get(input.spaceId),
      store.leases.list(),
    ])
    const errors = checkNewApplication(input, { applications, today })
    if (Object.keys(errors).length > 0) throw new ApiError(400, 'validation_failed', { fields: errors })
    // Checked on every send: the space may have been let or reserved while the form was open.
    if (!space || !isSpaceOpenForApplications(space, leases, today)) throw new ApiError(409, 'space_unavailable')

    const timestamp = time.toISOString()
    const application: Application = {
      id: randomUUID(),
      ...input,
      decidedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const created = await store.applications.insert(application)
    response.status(201).location(`/api/applications/${created.id}`).json(created)
  })

  router.put('/applications/:id', async (request, response) => {
    const existing = await store.applications.get(request.params.id)
    if (!existing) throw new ApiError(404, 'not_found')
    const input = await readInput(store, request.body)
    if (!canChangeApplicationStatus(existing.status, input.status)) {
      throw new ApiError(409, 'invalid_status_change', { from: existing.status, to: input.status })
    }
    const timestamp = now().toISOString()
    const updated = await store.applications.update({
      ...existing,
      ...input,
      // The application stays for the space it was made for.
      spaceId: existing.spaceId,
      decidedAt: resolveDecidedAt(input.status, existing, timestamp),
      updatedAt: timestamp,
    })
    if (!updated) throw new ApiError(404, 'not_found')
    response.json(updated)
  })

  // Nothing refers to an application, so it can always be deleted.
  router.delete('/applications/:id', async (request, response) => {
    if (!(await store.applications.delete(request.params.id))) throw new ApiError(404, 'not_found')
    response.status(204).end()
  })

  return router
}
