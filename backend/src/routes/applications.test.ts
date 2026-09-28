import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app.ts'
import type { Application } from '../domain/applications.ts'
import type { Space } from '../domain/spaces.ts'
import type { Tenant } from '../domain/tenants.ts'
import { createMemoryStore } from '../store/memoryStore.ts'
import type { Store } from '../store/store.ts'
import { application, lease } from '../test/fixtures.ts'
import { serve } from '../test/serve.ts'

const space = (id: string): Space => ({
  id,
  propertyId: 'property-1',
  name: id,
  type: 'apartment',
  floor: 1,
  areaM2: 40,
  rooms: 2,
  features: [],
  status: 'available',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const tenant: Tenant = {
  id: 'tenant-1',
  type: 'person',
  name: 'Lotta Esimerkki',
  contactPerson: null,
  email: 'lotta.esimerkki@example.com',
  phone: null,
  notes: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const dayOffset = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const input = {
  spaceId: 'space-1',
  applicantType: 'person',
  name: 'Lotta Esimerkki',
  email: 'lotta.esimerkki@example.com',
  phone: '+358501234565',
  desiredStartDate: dayOffset(30),
  message: 'Looking for a home in Kallio.',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

describe('applications API', () => {
  let store: Store
  let base: string

  const send = (method: string, path: string, body?: unknown) =>
    fetch(`${base}/api${path}`, {
      method,
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

  const create = async (overrides: Record<string, unknown> = {}): Promise<Application> =>
    (await send('POST', '/applications', { ...input, ...overrides })).json() as Promise<Application>

  beforeEach(async () => {
    store = createMemoryStore()
    await store.spaces.insert(space('space-1'))
    await store.spaces.insert(space('space-2'))
    await store.tenants.insert(tenant)
    base = await serve(createApp({ store }))
  })

  it('creates a submitted application, whatever status the client sends', async () => {
    const response = await send('POST', '/applications', { ...input, status: 'approved', tenantId: 'tenant-1' })

    expect(response.status).toBe(201)
    const created = (await response.json()) as Application
    expect(created).toEqual({
      ...input,
      id: expect.stringMatching(UUID),
      contactPerson: null,
      status: 'submitted',
      tenantId: null,
      decidedAt: null,
      createdAt: expect.stringMatching(ISO),
      updatedAt: created.createdAt,
    })
    expect(response.headers.get('location')).toBe(`/api/applications/${created.id}`)
    expect(await (await send('GET', '/applications')).json()).toEqual([created])
    expect(await (await send('GET', `/applications/${created.id}`)).json()).toEqual(created)
  })

  it('refuses invalid applications and applications for missing spaces', async () => {
    const invalid = await send('POST', '/applications', { ...input, email: 'nope', desiredStartDate: '' })
    expect(invalid.status).toBe(400)
    expect(await invalid.json()).toEqual({
      error: { code: 'validation_failed', fields: { email: 'invalid', desiredStartDate: 'required' } },
    })

    const missingSpace = await send('POST', '/applications', { ...input, spaceId: 'space-9' })
    expect(missingSpace.status).toBe(400)
    expect(await missingSpace.json()).toEqual({
      error: { code: 'validation_failed', fields: { spaceId: 'notFound' } },
    })
    expect(await store.applications.list()).toEqual([])
  })

  it('refuses a start date in the past and a second open application from the same email', async () => {
    const past = await send('POST', '/applications', { ...input, desiredStartDate: dayOffset(-1) })
    expect(past.status).toBe(400)
    expect(await past.json()).toEqual({
      error: { code: 'validation_failed', fields: { desiredStartDate: 'past' } },
    })

    await create()
    const again = await send('POST', '/applications', { ...input, email: 'LOTTA.esimerkki@example.com' })
    expect(again.status).toBe(400)
    expect(await again.json()).toEqual({ error: { code: 'validation_failed', fields: { email: 'duplicate' } } })

    // Another space, or after a decision, is fine.
    expect((await send('POST', '/applications', { ...input, spaceId: 'space-2' })).status).toBe(201)
    const [first] = await store.applications.list()
    await store.applications.update({ ...first!, status: 'withdrawn' })
    expect((await send('POST', '/applications', input)).status).toBe(201)
  })

  it('refuses applications for spaces that are let, in maintenance or reserved', async () => {
    const occupied = await store.spaces.get('space-2')
    await store.spaces.update({ ...occupied!, status: 'occupied' })
    const response = await send('POST', '/applications', { ...input, spaceId: 'space-2' })
    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: { code: 'space_unavailable' } })

    await store.leases.insert(lease({ id: 'lease-1', spaceId: 'space-1', startDate: dayOffset(10) }))
    expect((await send('POST', '/applications', input)).status).toBe(409)
    expect(await store.applications.list()).toEqual([])
  })

  it('changes the status and sets decidedAt when a decision is made', async () => {
    const created = await create()

    const review = await send('PUT', `/applications/${created.id}`, { ...created, status: 'in_review' })
    expect(review.status).toBe(200)
    expect(await review.json()).toMatchObject({ status: 'in_review', decidedAt: null })

    const reject = await send('PUT', `/applications/${created.id}`, { ...created, status: 'rejected' })
    const rejected = (await reject.json()) as Application
    expect(rejected).toMatchObject({ status: 'rejected', decidedAt: expect.stringMatching(ISO) })
    expect(rejected.updatedAt).toBe(rejected.decidedAt)
  })

  it('refuses status changes the rules do not allow', async () => {
    await store.applications.insert(application({ id: 'application-1', status: 'rejected' }))

    const response = await send('PUT', '/applications/application-1', { ...input, status: 'in_review' })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: { code: 'invalid_status_change', from: 'rejected', to: 'in_review' },
    })
    expect(await store.applications.get('application-1')).toMatchObject({ status: 'rejected' })
  })

  it('approves only with a tenant that exists', async () => {
    const created = await create()

    const withoutTenant = await send('PUT', `/applications/${created.id}`, { ...created, status: 'approved' })
    expect(withoutTenant.status).toBe(400)
    expect(await withoutTenant.json()).toEqual({
      error: { code: 'validation_failed', fields: { tenantId: 'required' } },
    })

    const missingTenant = await send('PUT', `/applications/${created.id}`, {
      ...created,
      status: 'approved',
      tenantId: 'tenant-9',
    })
    expect(await missingTenant.json()).toEqual({
      error: { code: 'validation_failed', fields: { tenantId: 'notFound' } },
    })

    const approved = await send('PUT', `/applications/${created.id}`, {
      ...created,
      status: 'approved',
      tenantId: 'tenant-1',
    })
    expect(await approved.json()).toMatchObject({ status: 'approved', tenantId: 'tenant-1' })
  })

  it('keeps the space an application was made for', async () => {
    const created = await create()

    const response = await send('PUT', `/applications/${created.id}`, { ...created, spaceId: 'space-2' })

    expect(await response.json()).toMatchObject({ spaceId: 'space-1' })
  })

  it('answers 404 for applications that do not exist', async () => {
    expect((await send('GET', '/applications/nope')).status).toBe(404)
    expect((await send('PUT', '/applications/nope', input)).status).toBe(404)
    expect((await send('DELETE', '/applications/nope')).status).toBe(404)
  })

  it('deletes an application', async () => {
    const created = await create()

    const response = await send('DELETE', `/applications/${created.id}`)

    expect(response.status).toBe(204)
    expect(await store.applications.list()).toEqual([])
  })

  it('stops creating applications when the collection is full', async () => {
    base = await serve(
      createApp({
        store,
        collectionLimits: {
          properties: 50,
          spaces: 500,
          maintenance: 500,
          tenants: 300,
          leases: 1000,
          applications: 1,
        },
      }),
    )
    await create()

    const response = await send('POST', '/applications', input)

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: { code: 'limit_reached', limit: 1 } })
  })
})
