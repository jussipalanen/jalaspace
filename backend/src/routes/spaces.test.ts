import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app.ts'
import type { Property } from '../domain/properties.ts'
import type { Space } from '../domain/spaces.ts'
import { createMemoryStore } from '../store/memoryStore.ts'
import type { Store } from '../store/store.ts'
import { maintenanceTask } from '../test/fixtures.ts'
import { serve } from '../test/serve.ts'

const property = (id: string): Property => ({
  id,
  name: id,
  type: 'office',
  address: 'Siltakatu 12',
  postalCode: '80100',
  city: 'Joensuu',
  description: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const input = {
  propertyId: 'property-1',
  name: 'A 101',
  type: 'office',
  floor: 1,
  areaM2: 62.5,
  status: 'available',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

describe('spaces API', () => {
  let store: Store
  let base: string

  const send = (method: string, path: string, body?: unknown) =>
    fetch(`${base}/api${path}`, {
      method,
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

  const create = async (overrides: Partial<typeof input> = {}): Promise<Space> =>
    (await send('POST', '/units', { ...input, ...overrides })).json() as Promise<Space>

  beforeEach(async () => {
    store = createMemoryStore()
    await store.properties.insert(property('property-1'))
    await store.properties.insert(property('property-2'))
    base = await serve(createApp({ store }))
  })

  it('starts with an empty list', async () => {
    const response = await send('GET', '/units')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('creates a space with a server-assigned id and timestamps', async () => {
    const response = await send('POST', '/units', {
      ...input,
      name: '  A 101 ',
      id: 'client-chosen',
      createdAt: '2000-01-01T00:00:00.000Z',
    })

    expect(response.status).toBe(201)
    const created = (await response.json()) as Space
    expect(created).toMatchObject(input)
    expect(created.id).toMatch(UUID)
    expect(created.createdAt).toMatch(ISO)
    expect(created.updatedAt).toBe(created.createdAt)
    expect(response.headers.get('location')).toBe(`/api/units/${created.id}`)

    expect(await (await send('GET', '/units')).json()).toEqual([created])
    expect(await (await send('GET', `/units/${created.id}`)).json()).toEqual(created)
  })

  it('does not create an occupied space, because it has no lease yet', async () => {
    expect((await create({ status: 'occupied' })).status).toBe('available')
    expect((await create({ name: 'A 102', status: 'maintenance' })).status).toBe('maintenance')
  })

  it('rejects invalid input with field codes and stores nothing', async () => {
    const response = await send('POST', '/units', { ...input, name: '', floor: 1.5, areaM2: 0 })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: { code: 'validation_failed', fields: { name: 'required', floor: 'invalid', areaM2: 'invalid' } },
    })
    expect(await store.spaces.list()).toEqual([])
  })

  it('rejects a property that does not exist', async () => {
    const response = await send('POST', '/units', { ...input, propertyId: 'missing' })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: { code: 'validation_failed', fields: { propertyId: 'notFound' } },
    })
    expect(await store.spaces.list()).toEqual([])
  })

  it('rejects a name the property already uses, ignoring case', async () => {
    await create()

    const response = await send('POST', '/units', { ...input, name: 'a 101' })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: { code: 'validation_failed', fields: { name: 'duplicate' } } })
    // Another property may use the same name.
    expect((await send('POST', '/units', { ...input, propertyId: 'property-2' })).status).toBe(201)
  })

  it('answers unknown ids with not_found', async () => {
    for (const [method, body] of [['GET'], ['PUT', input], ['DELETE']] as const) {
      const response = await send(method, '/units/missing', body)
      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: { code: 'not_found' } })
    }
  })

  it('updates the editable fields and keeps the id and creation time', async () => {
    const created = await create()
    // Make sure the update gets a later timestamp.
    await new Promise((resolve) => setTimeout(resolve, 5))
    const changes = { ...input, name: 'A 101B', type: 'storage', floor: -1, areaM2: 12.25, status: 'maintenance' }

    const response = await send('PUT', `/units/${created.id}`, {
      ...changes,
      id: 'other',
      createdAt: '2000-01-01T00:00:00.000Z',
    })

    expect(response.status).toBe(200)
    const updated = (await response.json()) as Space
    expect(updated).toMatchObject({ ...changes, id: created.id, createdAt: created.createdAt })
    expect(updated.updatedAt > created.updatedAt).toBe(true)
    expect(await store.spaces.get(created.id)).toEqual(updated)
  })

  it('lets a space keep its own name when it is updated', async () => {
    const created = await create()
    const response = await send('PUT', `/units/${created.id}`, { ...input, name: 'a 101' })
    expect(response.status).toBe(200)
  })

  it('does not change a space when the update is invalid', async () => {
    const created = await create()

    const response = await send('PUT', `/units/${created.id}`, { ...input, type: 'castle' })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: { code: 'validation_failed', fields: { type: 'invalid' } } })
    expect(await store.spaces.get(created.id)).toEqual(created)
  })

  it('keeps an occupied space occupied and does not let a client occupy one', async () => {
    const free = await create()
    const occupied: Space = { ...free, id: 'space-occupied', name: 'A 102', status: 'occupied' }
    await store.spaces.insert(occupied)

    const freed = await send('PUT', `/units/${occupied.id}`, { ...input, name: 'A 102', status: 'available' })
    const taken = await send('PUT', `/units/${free.id}`, { ...input, status: 'occupied' })

    expect(((await freed.json()) as Space).status).toBe('occupied')
    expect(((await taken.json()) as Space).status).toBe('available')
  })

  it('does not move a space with maintenance tasks to another property', async () => {
    const created = await create()
    await store.maintenance.insert(maintenanceTask({ id: 'task-1', spaceId: created.id }))

    const response = await send('PUT', `/units/${created.id}`, { ...input, propertyId: 'property-2' })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: { code: 'validation_failed', fields: { propertyId: 'maintenanceLinked' } },
    })
    expect(await store.spaces.get(created.id)).toEqual(created)
  })

  it('deletes a space nothing refers to', async () => {
    const created = await create()

    const response = await send('DELETE', `/units/${created.id}`)

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
    expect((await send('GET', `/units/${created.id}`)).status).toBe(404)
  })

  it('refuses to delete a space that still has leases or maintenance tasks', async () => {
    const created = await create()
    const reference = { spaceId: created.id, createdAt: '', updatedAt: '' }
    await store.leases.insert({ id: 'lease-1', ...reference })
    await store.leases.insert({ id: 'lease-2', ...reference })
    await store.maintenance.insert(maintenanceTask({ id: 'task-1', spaceId: created.id }))

    const response = await send('DELETE', `/units/${created.id}`)

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: { code: 'space_in_use', leaseCount: 2, maintenanceCount: 1 },
    })
    expect(await store.spaces.get(created.id)).toEqual(created)
  })

  it('makes a property with spaces impossible to delete', async () => {
    await create()

    const response = await send('DELETE', '/properties/property-1')

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: { code: 'property_in_use', spaceCount: 1, maintenanceCount: 0 },
    })
  })
})
