import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app.ts'
import type { Lease } from '../domain/leases.ts'
import type { Space } from '../domain/spaces.ts'
import type { Tenant } from '../domain/tenants.ts'
import { createMemoryStore } from '../store/memoryStore.ts'
import type { Store } from '../store/store.ts'
import { serve } from '../test/serve.ts'

const CREATED = '2026-01-01T00:00:00.000Z'
const DAY_MS = 24 * 60 * 60 * 1000
/** A date relative to the real today (UTC), since the routes use the current time. */
const dateIn = (days: number) => new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10)

const tenant = (id: string): Tenant => ({
  id,
  type: 'company',
  name: id,
  contactPerson: null,
  email: `${id}@example.com`,
  phone: null,
  notes: '',
  createdAt: CREATED,
  updatedAt: CREATED,
})

const space = (id: string, status: Space['status'] = 'available'): Space => ({
  id,
  propertyId: 'property-1',
  name: id,
  type: 'office',
  floor: 1,
  areaM2: 50,
  status,
  createdAt: CREATED,
  updatedAt: CREATED,
})

const input = {
  tenantId: 'tenant-1',
  spaceId: 'space-1',
  startDate: dateIn(-30),
  endDate: null as string | null,
  monthlyRentCents: 125050,
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

describe('leases API', () => {
  let store: Store
  let base: string

  const send = (method: string, path: string, body?: unknown) =>
    fetch(`${base}/api${path}`, {
      method,
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

  const create = async (overrides: Partial<typeof input> = {}): Promise<Lease> =>
    (await send('POST', '/leases', { ...input, ...overrides })).json() as Promise<Lease>

  const spaceStatus = async (id = 'space-1') => (await store.spaces.get(id))?.status

  beforeEach(async () => {
    store = createMemoryStore()
    await store.tenants.insert(tenant('tenant-1'))
    await store.tenants.insert(tenant('tenant-2'))
    await store.spaces.insert(space('space-1'))
    await store.spaces.insert(space('space-2'))
    await store.spaces.insert(space('space-repair', 'maintenance'))
    base = await serve(createApp({ store }))
  })

  it('starts with an empty list', async () => {
    const response = await send('GET', '/leases')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('creates a lease with a server-assigned id and timestamps, and occupies the space', async () => {
    const response = await send('POST', '/leases', { ...input, id: 'client-chosen', createdAt: CREATED })

    expect(response.status).toBe(201)
    const created = (await response.json()) as Lease
    expect(created).toMatchObject(input)
    expect(created.id).toMatch(UUID)
    expect(created.createdAt).toMatch(ISO)
    expect(created.updatedAt).toBe(created.createdAt)
    expect(response.headers.get('location')).toBe(`/api/leases/${created.id}`)
    expect(await spaceStatus()).toBe('occupied')

    expect(await (await send('GET', '/leases')).json()).toEqual([created])
    expect(await (await send('GET', `/leases/${created.id}`)).json()).toEqual(created)
  })

  it('does not occupy the space for an upcoming lease', async () => {
    const created = await create({ startDate: dateIn(10), monthlyRentCents: undefined })
    expect(created.monthlyRentCents).toBeNull()
    expect(await spaceStatus()).toBe('available')
  })

  it('rejects invalid input with field codes and stores nothing', async () => {
    const response = await send('POST', '/leases', { ...input, endDate: dateIn(-31), monthlyRentCents: 12.5 })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: { code: 'validation_failed', fields: { endDate: 'beforeStart', monthlyRentCents: 'invalid' } },
    })
    expect(await store.leases.list()).toEqual([])
  })

  it('rejects a tenant or space that does not exist', async () => {
    const response = await send('POST', '/leases', { ...input, tenantId: 'missing', spaceId: 'missing' })

    expect(await response.json()).toEqual({
      error: { code: 'validation_failed', fields: { tenantId: 'notFound', spaceId: 'notFound' } },
    })
    expect(await store.leases.list()).toEqual([])
  })

  it('rejects a period that overlaps another lease of the space', async () => {
    await create({ endDate: dateIn(30) })

    const overlapping = await send('POST', '/leases', { ...input, tenantId: 'tenant-2', startDate: dateIn(30) })
    const next = await send('POST', '/leases', { ...input, tenantId: 'tenant-2', startDate: dateIn(31) })

    expect(await overlapping.json()).toEqual({ error: { code: 'validation_failed', fields: { spaceId: 'overlap' } } })
    expect(next.status).toBe(201)
  })

  it('does not start an active lease on a space in maintenance', async () => {
    const active = await send('POST', '/leases', { ...input, spaceId: 'space-repair' })
    const upcoming = await send('POST', '/leases', { ...input, spaceId: 'space-repair', startDate: dateIn(60) })

    expect(await active.json()).toEqual({ error: { code: 'validation_failed', fields: { spaceId: 'maintenance' } } })
    expect(upcoming.status).toBe(201)
    expect(await spaceStatus('space-repair')).toBe('maintenance')
  })

  it('answers unknown ids with not_found', async () => {
    for (const [method, body] of [['GET'], ['PUT', input], ['DELETE']] as const) {
      const response = await send(method, '/leases/missing', body)
      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: { code: 'not_found' } })
    }
  })

  it('updates the period and rent, and keeps the tenant, space, id and creation time', async () => {
    const created = await create()
    // Make sure the update gets a later timestamp.
    await new Promise((resolve) => setTimeout(resolve, 5))
    const changes = { startDate: dateIn(-60), endDate: dateIn(365), monthlyRentCents: 99900 }

    const response = await send('PUT', `/leases/${created.id}`, {
      ...changes,
      tenantId: 'tenant-2',
      spaceId: 'space-2',
      id: 'other',
    })

    expect(response.status).toBe(200)
    const updated = (await response.json()) as Lease
    expect(updated).toMatchObject({ ...changes, tenantId: 'tenant-1', spaceId: 'space-1', id: created.id })
    expect(updated.createdAt).toBe(created.createdAt)
    expect(updated.updatedAt > created.updatedAt).toBe(true)
    expect(await store.leases.get(created.id)).toEqual(updated)
  })

  it('does not overlap a lease with itself when it is updated', async () => {
    const created = await create()
    const response = await send('PUT', `/leases/${created.id}`, { ...input, endDate: dateIn(100) })
    expect(response.status).toBe(200)
  })

  it('does not change a lease when the update is invalid', async () => {
    const created = await create()

    const response = await send('PUT', `/leases/${created.id}`, { ...input, startDate: '' })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: { code: 'validation_failed', fields: { startDate: 'required' } } })
    expect(await store.leases.get(created.id)).toEqual(created)
  })

  it('frees the space when a lease is ended in the past', async () => {
    const created = await create()
    expect(await spaceStatus()).toBe('occupied')

    await send('PUT', `/leases/${created.id}`, { ...input, endDate: dateIn(-1) })

    expect(await spaceStatus()).toBe('available')
  })

  it('deletes a lease and frees its space', async () => {
    const created = await create()

    const response = await send('DELETE', `/leases/${created.id}`)

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
    expect((await send('GET', `/leases/${created.id}`)).status).toBe(404)
    expect(await spaceStatus()).toBe('available')
  })

  it('keeps the space occupied when another active lease remains', async () => {
    const past = await create({ tenantId: 'tenant-2', startDate: dateIn(-400), endDate: dateIn(-100) })
    await create()

    await send('DELETE', `/leases/${past.id}`)

    expect(await spaceStatus()).toBe('occupied')
  })

  it('keeps the tenant and space of a lease from being deleted', async () => {
    await create()

    const deleteTenant = await send('DELETE', '/tenants/tenant-1')
    const deleteSpace = await send('DELETE', '/units/space-1')

    expect(await deleteTenant.json()).toEqual({ error: { code: 'tenant_in_use', leaseCount: 1 } })
    expect(await deleteSpace.json()).toEqual({ error: { code: 'space_in_use', leaseCount: 1, maintenanceCount: 0 } })
  })
})
