import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import {
  checkTenantDeletion,
  checkTenantEmail,
  parseTenantInput,
  type Tenant,
  type TenantInput,
} from '../domain/tenants.ts'
import { ApiError } from '../errors.ts'
import type { Store } from '../store/store.ts'

/**
 * Returns the checked input, or throws `400 validation_failed` with the field
 * codes. The email is checked against the current tenants on every save.
 */
async function readInput(store: Store, body: unknown, editingId?: string): Promise<TenantInput> {
  const result = parseTenantInput(body)
  if (!result.ok) throw new ApiError(400, 'validation_failed', { fields: result.errors })

  const errors = checkTenantEmail(result.values.email, await store.tenants.list(), editingId)
  if (Object.keys(errors).length > 0) throw new ApiError(400, 'validation_failed', { fields: errors })
  return result.values
}

/** `/api/tenants`: list, read, create, update and delete tenants. */
export function tenantsRouter(store: Store, now: () => Date = () => new Date()): Router {
  const router = Router()

  router.get('/tenants', async (_request, response) => {
    response.json(await store.tenants.list())
  })

  router.get('/tenants/:id', async (request, response) => {
    const tenant = await store.tenants.get(request.params.id)
    if (!tenant) throw new ApiError(404, 'not_found')
    response.json(tenant)
  })

  router.post('/tenants', async (request, response) => {
    const input = await readInput(store, request.body)
    const timestamp = now().toISOString()
    const tenant: Tenant = { id: randomUUID(), ...input, createdAt: timestamp, updatedAt: timestamp }
    const created = await store.tenants.insert(tenant)
    response.status(201).location(`/api/tenants/${created.id}`).json(created)
  })

  router.put('/tenants/:id', async (request, response) => {
    const existing = await store.tenants.get(request.params.id)
    if (!existing) throw new ApiError(404, 'not_found')
    const input = await readInput(store, request.body, existing.id)
    const updated = await store.tenants.update({ ...existing, ...input, updatedAt: now().toISOString() })
    if (!updated) throw new ApiError(404, 'not_found')
    response.json(updated)
  })

  router.delete('/tenants/:id', async (request, response) => {
    const { id } = request.params
    if (!(await store.tenants.get(id))) throw new ApiError(404, 'not_found')

    // Checked with the current data on every delete, like properties and spaces.
    const check = checkTenantDeletion(id, await store.leases.list())
    if (!check.allowed) throw new ApiError(409, 'tenant_in_use', { leaseCount: check.leaseCount })

    await store.tenants.delete(id)
    response.status(204).end()
  })

  return router
}
