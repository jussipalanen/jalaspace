import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app.ts'
import type { Property } from '../domain/properties.ts'
import type { Space } from '../domain/spaces.ts'
import { createMemoryStore } from '../store/memoryStore.ts'
import type { Store } from '../store/store.ts'
import { maintenanceTask } from '../test/fixtures.ts'
import { serve } from '../test/serve.ts'

const input = {
  name: 'Joensuu Center',
  type: 'mixed_use',
  address: 'Siltakatu 12',
  postalCode: '80100',
  city: 'Joensuu',
  description: 'City-centre building.',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

describe('properties API', () => {
  let store: Store
  let base: string

  const send = (method: string, path: string, body?: unknown) =>
    fetch(`${base}/api${path}`, {
      method,
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

  const create = async (overrides: Partial<typeof input> = {}): Promise<Property> =>
    (await send('POST', '/properties', { ...input, ...overrides })).json() as Promise<Property>

  beforeEach(async () => {
    store = createMemoryStore()
    base = await serve(createApp({ store }))
  })

  it('starts with an empty list', async () => {
    const response = await send('GET', '/properties')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('creates a property with a server-assigned id and timestamps', async () => {
    const response = await send('POST', '/properties', {
      ...input,
      name: '  Joensuu Center ',
      id: 'client-chosen',
      createdAt: '2000-01-01T00:00:00.000Z',
    })

    expect(response.status).toBe(201)
    const created = (await response.json()) as Property
    expect(created).toMatchObject(input)
    expect(created.id).toMatch(UUID)
    expect(created.createdAt).toMatch(ISO)
    expect(created.updatedAt).toBe(created.createdAt)
    expect(response.headers.get('location')).toBe(`/api/properties/${created.id}`)

    expect(await (await send('GET', '/properties')).json()).toEqual([created])
    expect(await (await send('GET', `/properties/${created.id}`)).json()).toEqual(created)
  })

  it('rejects invalid input with field codes and stores nothing', async () => {
    const response = await send('POST', '/properties', { ...input, name: '', postalCode: '123' })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: { code: 'validation_failed', fields: { name: 'required', postalCode: 'invalid' } },
    })
    expect(await store.properties.list()).toEqual([])
  })

  it('treats a body that is not JSON as missing every field', async () => {
    const response = await fetch(`${base}/api/properties`, { method: 'POST', body: 'name=Joensuu' })
    expect(response.status).toBe(400)
    const { error } = (await response.json()) as { error: { code: string; fields: object } }
    expect(error.code).toBe('validation_failed')
    expect(Object.keys(error.fields)).toEqual(['name', 'address', 'postalCode', 'city', 'type'])
  })

  it('answers unknown ids with not_found', async () => {
    for (const [method, body] of [['GET'], ['PUT', input], ['DELETE']] as const) {
      const response = await send(method, '/properties/missing', body)
      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: { code: 'not_found' } })
    }
  })

  it('updates the editable fields and keeps the id and creation time', async () => {
    const created = await create()
    // Make sure the update gets a later timestamp.
    await new Promise((resolve) => setTimeout(resolve, 5))

    const response = await send('PUT', `/properties/${created.id}`, {
      ...input,
      name: 'Joensuu Centre',
      city: ' Joensuu ',
      id: 'other',
      createdAt: '2000-01-01T00:00:00.000Z',
    })

    expect(response.status).toBe(200)
    const updated = (await response.json()) as Property
    expect(updated).toMatchObject({ ...input, name: 'Joensuu Centre', id: created.id, createdAt: created.createdAt })
    expect(updated.updatedAt > created.updatedAt).toBe(true)
    expect(await store.properties.get(created.id)).toEqual(updated)
  })

  it('does not change a property when the update is invalid', async () => {
    const created = await create()

    const response = await send('PUT', `/properties/${created.id}`, { ...input, type: 'castle' })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: { code: 'validation_failed', fields: { type: 'invalid' } } })
    expect(await store.properties.get(created.id)).toEqual(created)
  })

  it('deletes a property nothing refers to', async () => {
    const created = await create()

    const response = await send('DELETE', `/properties/${created.id}`)

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
    expect((await send('GET', `/properties/${created.id}`)).status).toBe(404)
  })

  it('refuses to delete a property that still has spaces or maintenance tasks', async () => {
    const created = await create()
    const space = (id: string, name: string): Space => ({
      id,
      propertyId: created.id,
      name,
      type: 'office',
      floor: 1,
      areaM2: 50,
      status: 'available',
      createdAt: '',
      updatedAt: '',
    })
    await store.spaces.insert(space('space-1', 'A 101'))
    await store.spaces.insert(space('space-2', 'A 102'))
    await store.maintenance.insert(maintenanceTask({ id: 'task-1', propertyId: created.id }))

    const response = await send('DELETE', `/properties/${created.id}`)

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: { code: 'property_in_use', spaceCount: 2, maintenanceCount: 1 },
    })
    expect(await store.properties.get(created.id)).toEqual(created)
  })
})
