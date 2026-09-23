import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app.ts'
import type { Tenant } from '../domain/tenants.ts'
import { createMemoryStore } from '../store/memoryStore.ts'
import type { Store } from '../store/store.ts'
import { lease } from '../test/fixtures.ts'
import { serve } from '../test/serve.ts'

const input = {
  type: 'company',
  name: 'Nordic Pixel Oy',
  contactPerson: 'Aleksi Rautio',
  email: 'info@nordic-pixel.example',
  phone: '+358 40 123 4567',
  notes: 'Software development company.',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

describe('tenants API', () => {
  let store: Store
  let base: string

  const send = (method: string, path: string, body?: unknown) =>
    fetch(`${base}/api${path}`, {
      method,
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

  const create = async (overrides: Partial<typeof input> = {}): Promise<Tenant> =>
    (await send('POST', '/tenants', { ...input, ...overrides })).json() as Promise<Tenant>

  beforeEach(async () => {
    store = createMemoryStore()
    base = await serve(createApp({ store }))
  })

  it('starts with an empty list', async () => {
    const response = await send('GET', '/tenants')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('creates a tenant with a server-assigned id and timestamps', async () => {
    const response = await send('POST', '/tenants', {
      ...input,
      name: '  Nordic Pixel Oy ',
      id: 'client-chosen',
      createdAt: '2000-01-01T00:00:00.000Z',
    })

    expect(response.status).toBe(201)
    const created = (await response.json()) as Tenant
    expect(created).toMatchObject(input)
    expect(created.id).toMatch(UUID)
    expect(created.createdAt).toMatch(ISO)
    expect(created.updatedAt).toBe(created.createdAt)
    expect(response.headers.get('location')).toBe(`/api/tenants/${created.id}`)

    expect(await (await send('GET', '/tenants')).json()).toEqual([created])
    expect(await (await send('GET', `/tenants/${created.id}`)).json()).toEqual(created)
  })

  it('creates a person without a contact person or phone', async () => {
    const created = await create({ type: 'person', name: 'Aino Virtanen', email: 'aino@example.com', phone: '' })
    expect(created).toMatchObject({ type: 'person', contactPerson: null, phone: null })
  })

  it('rejects invalid input with field codes and stores nothing', async () => {
    const response = await send('POST', '/tenants', { ...input, name: '', email: 'info', phone: '12' })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: { code: 'validation_failed', fields: { name: 'required', email: 'invalid', phone: 'invalid' } },
    })
    expect(await store.tenants.list()).toEqual([])
  })

  it('rejects an email another tenant uses, ignoring case', async () => {
    await create()

    const response = await send('POST', '/tenants', { ...input, email: 'INFO@nordic-pixel.example' })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: { code: 'validation_failed', fields: { email: 'duplicate' } } })
    expect(await store.tenants.list()).toHaveLength(1)
  })

  it('answers unknown ids with not_found', async () => {
    for (const [method, body] of [['GET'], ['PUT', input], ['DELETE']] as const) {
      const response = await send(method, '/tenants/missing', body)
      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: { code: 'not_found' } })
    }
  })

  it('updates the editable fields and keeps the id and creation time', async () => {
    const created = await create()
    // Make sure the update gets a later timestamp.
    await new Promise((resolve) => setTimeout(resolve, 5))
    const changes = { ...input, name: 'Nordic Pixel Ltd', email: 'Info@Nordic-Pixel.example', phone: null }

    const response = await send('PUT', `/tenants/${created.id}`, { ...changes, id: 'other' })

    expect(response.status).toBe(200)
    const updated = (await response.json()) as Tenant
    expect(updated).toMatchObject({ ...changes, id: created.id, createdAt: created.createdAt })
    expect(updated.updatedAt > created.updatedAt).toBe(true)
    expect(await store.tenants.get(created.id)).toEqual(updated)
  })

  it('does not change a tenant when the update is invalid', async () => {
    const created = await create()
    const other = await create({ email: 'info@lumo-florist.example' })

    const response = await send('PUT', `/tenants/${other.id}`, { ...input, email: created.email })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: { code: 'validation_failed', fields: { email: 'duplicate' } } })
    expect(await store.tenants.get(other.id)).toEqual(other)
  })

  it('deletes a tenant without leases', async () => {
    const created = await create()

    const response = await send('DELETE', `/tenants/${created.id}`)

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
    expect((await send('GET', `/tenants/${created.id}`)).status).toBe(404)
  })

  it('refuses to delete a tenant that still has leases', async () => {
    const created = await create()
    await store.leases.insert(lease({ id: 'lease-1', tenantId: created.id }))
    await store.leases.insert(lease({ id: 'lease-2', tenantId: created.id, spaceId: 'space-2' }))

    const response = await send('DELETE', `/tenants/${created.id}`)

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: { code: 'tenant_in_use', leaseCount: 2 } })
    expect(await store.tenants.get(created.id)).toEqual(created)
  })
})
