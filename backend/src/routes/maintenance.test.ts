import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app.ts'
import type { MaintenanceTask } from '../domain/maintenance.ts'
import type { Property } from '../domain/properties.ts'
import type { Space } from '../domain/spaces.ts'
import { createMemoryStore } from '../store/memoryStore.ts'
import type { Store } from '../store/store.ts'
import { serve } from '../test/serve.ts'

const CREATED = '2026-01-01T00:00:00.000Z'

const property = (id: string): Property => ({
  id,
  name: id,
  type: 'office',
  address: 'Siltakatu 12',
  postalCode: '80100',
  city: 'Joensuu',
  description: '',
  createdAt: CREATED,
  updatedAt: CREATED,
})

const space = (id: string, propertyId: string): Space => ({
  id,
  propertyId,
  name: id,
  type: 'office',
  floor: 1,
  areaM2: 50,
  status: 'available',
  createdAt: CREATED,
  updatedAt: CREATED,
})

const input = {
  propertyId: 'property-1',
  spaceId: 'space-1',
  title: 'Leaking tap',
  description: 'The kitchen tap drips.',
  category: 'plumbing',
  priority: 'medium',
  status: 'open',
  dueDate: '2026-09-30',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

describe('maintenance API', () => {
  let store: Store
  let base: string

  const send = (method: string, path: string, body?: unknown) =>
    fetch(`${base}/api${path}`, {
      method,
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

  const create = async (overrides: Partial<typeof input> = {}): Promise<MaintenanceTask> =>
    (await send('POST', '/maintenance', { ...input, ...overrides })).json() as Promise<MaintenanceTask>

  const update = async (id: string, overrides: Partial<typeof input>): Promise<MaintenanceTask> =>
    (await send('PUT', `/maintenance/${id}`, { ...input, ...overrides })).json() as Promise<MaintenanceTask>

  // Makes sure the next write gets a later timestamp.
  const tick = () => new Promise((resolve) => setTimeout(resolve, 5))

  beforeEach(async () => {
    store = createMemoryStore()
    await store.properties.insert(property('property-1'))
    await store.properties.insert(property('property-2'))
    await store.spaces.insert(space('space-1', 'property-1'))
    await store.spaces.insert(space('space-2', 'property-2'))
    base = await serve(createApp({ store }))
  })

  it('starts with an empty list', async () => {
    const response = await send('GET', '/maintenance')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('creates a task with a server-assigned id and timestamps', async () => {
    const response = await send('POST', '/maintenance', {
      ...input,
      title: '  Leaking tap ',
      id: 'client-chosen',
      completedAt: '2000-01-01T00:00:00.000Z',
      createdAt: '2000-01-01T00:00:00.000Z',
    })

    expect(response.status).toBe(201)
    const created = (await response.json()) as MaintenanceTask
    expect(created).toMatchObject({ ...input, completedAt: null })
    expect(created.id).toMatch(UUID)
    expect(created.createdAt).toMatch(ISO)
    expect(created.updatedAt).toBe(created.createdAt)
    expect(response.headers.get('location')).toBe(`/api/maintenance/${created.id}`)

    expect(await (await send('GET', '/maintenance')).json()).toEqual([created])
    expect(await (await send('GET', `/maintenance/${created.id}`)).json()).toEqual(created)
  })

  it('creates a task for the whole property without a space or a due date', async () => {
    const created = await create({ spaceId: '', dueDate: '' })
    expect(created).toMatchObject({ spaceId: null, dueDate: null })
  })

  it('sets the completion time of a task created as completed', async () => {
    const created = await create({ status: 'completed' })
    expect(created.completedAt).toBe(created.createdAt)
  })

  it('rejects invalid input with field codes and stores nothing', async () => {
    const response = await send('POST', '/maintenance', { ...input, title: '', dueDate: '2026-02-30' })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: { code: 'validation_failed', fields: { title: 'required', dueDate: 'invalid' } },
    })
    expect(await store.maintenance.list()).toEqual([])
  })

  it('rejects a property that does not exist and a space of another property', async () => {
    const missing = await send('POST', '/maintenance', { ...input, propertyId: 'missing', spaceId: null })
    const otherSpace = await send('POST', '/maintenance', { ...input, spaceId: 'space-2' })

    expect(await missing.json()).toEqual({ error: { code: 'validation_failed', fields: { propertyId: 'notFound' } } })
    expect(await otherSpace.json()).toEqual({ error: { code: 'validation_failed', fields: { spaceId: 'invalid' } } })
    expect(await store.maintenance.list()).toEqual([])
  })

  it('answers unknown ids with not_found', async () => {
    for (const [method, body] of [['GET'], ['PUT', input], ['DELETE']] as const) {
      const response = await send(method, '/maintenance/missing', body)
      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: { code: 'not_found' } })
    }
  })

  it('updates the editable fields and keeps the id and creation time', async () => {
    const created = await create()
    await tick()
    const changes = {
      ...input,
      propertyId: 'property-2',
      spaceId: 'space-2',
      title: 'Tap replaced',
      category: 'general',
      priority: 'high',
      status: 'in_progress',
      dueDate: null,
    }

    const response = await send('PUT', `/maintenance/${created.id}`, { ...changes, id: 'other', createdAt: CREATED })

    expect(response.status).toBe(200)
    const updated = (await response.json()) as MaintenanceTask
    expect(updated).toMatchObject({ ...changes, id: created.id, createdAt: created.createdAt, completedAt: null })
    expect(updated.updatedAt > created.updatedAt).toBe(true)
    expect(await store.maintenance.get(created.id)).toEqual(updated)
  })

  it('does not change a task when the update is invalid', async () => {
    const created = await create()

    const response = await send('PUT', `/maintenance/${created.id}`, { ...input, priority: 'urgent' })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: { code: 'validation_failed', fields: { priority: 'invalid' } } })
    expect(await store.maintenance.get(created.id)).toEqual(created)
  })

  it('sets completedAt on completion, keeps it while completed and clears it on reopening', async () => {
    const created = await create()
    await tick()

    const completed = await update(created.id, { status: 'completed' })
    expect(completed.completedAt).toBe(completed.updatedAt)
    expect(completed.completedAt! > created.createdAt).toBe(true)

    await tick()
    const edited = await update(created.id, { status: 'completed', title: 'Leaking tap fixed' })
    expect(edited.completedAt).toBe(completed.completedAt)
    expect(edited.updatedAt > completed.updatedAt).toBe(true)

    const reopened = await update(created.id, { status: 'open' })
    expect(reopened.completedAt).toBeNull()
  })

  it('deletes a task', async () => {
    const created = await create()

    const response = await send('DELETE', `/maintenance/${created.id}`)

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
    expect((await send('GET', `/maintenance/${created.id}`)).status).toBe(404)
  })

  it('keeps the property and space of a task from being deleted', async () => {
    await create()

    const deleteProperty = await send('DELETE', '/properties/property-1')
    const deleteSpace = await send('DELETE', '/units/space-1')

    expect(await deleteProperty.json()).toEqual({
      error: { code: 'property_in_use', spaceCount: 1, maintenanceCount: 1 },
    })
    expect(await deleteSpace.json()).toEqual({ error: { code: 'space_in_use', leaseCount: 0, maintenanceCount: 1 } })
  })

  it('leaves the AI suggestions endpoint in place', async () => {
    const response = await send('POST', '/maintenance/suggestions', { title: 'Leaking tap' })
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: { code: 'ai_unavailable' } })
  })
})
