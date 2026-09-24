import { describe, expect, it } from 'vitest'
import { createMemoryStore } from '../store/memoryStore.ts'
import { lease, maintenanceTask } from '../test/fixtures.ts'
import { createDemoData, resetDemoData } from './demoData.ts'
import { checkLeaseReferences, getLeaseStatus, parseLeaseInput, reconcileSpaceStatuses, toIsoDate } from './leases.ts'
import { checkMaintenanceReferences, parseMaintenanceInput } from './maintenance.ts'
import { parsePropertyInput } from './properties.ts'
import { checkSpaceReferences, parseSpaceInput } from './spaces.ts'
import { checkTenantDeletion, checkTenantEmail, parseTenantInput } from './tenants.ts'

const now = new Date('2026-09-22T10:30:00.000Z')

describe('demo data', () => {
  it('has the four demo properties with the same ids as the frontend seed', () => {
    expect(createDemoData(now).properties.map(({ id }) => id)).toEqual([
      'property-joensuu-center',
      'property-kuopio-harbour',
      'property-tampere-hervanta',
      'property-helsinki-kallio',
    ])
  })

  it('dates the properties relative to now', () => {
    const [joensuu] = createDemoData(now).properties
    expect(joensuu).toMatchObject({
      createdAt: '2024-10-02T10:30:00.000Z',
      updatedAt: '2024-10-02T10:30:00.000Z',
    })
  })

  it('passes the same validation as data sent by clients', () => {
    for (const property of createDemoData(now).properties) {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = property
      expect(parsePropertyInput(input)).toEqual({ ok: true, values: input })
    }
  })

  it('has the 68 demo spaces of the frontend seed', () => {
    const { spaces } = createDemoData(now)
    const count = (status: string) => spaces.filter((space) => space.status === status).length

    expect(spaces).toHaveLength(68)
    expect(count('occupied')).toBe(58)
    expect(count('available')).toBe(7)
    expect(count('maintenance')).toBe(3)
    expect(new Set(spaces.map(({ id }) => id)).size).toBe(68)
  })

  it('names, sizes and dates the spaces like the frontend seed', () => {
    const { properties, spaces } = createDemoData(now)
    const byId = (id: string) => spaces.find((space) => space.id === id)

    expect(byId('space-joensuu-center-1')).toMatchObject({ name: 'Retail 1', type: 'retail', floor: 1, areaM2: 140 })
    expect(byId('space-joensuu-center-5')).toMatchObject({ name: 'A 201', floor: 2, areaM2: 67, status: 'available' })
    expect(byId('space-joensuu-center-16')).toMatchObject({ name: 'A 306', status: 'maintenance' })
    expect(byId('space-kuopio-harbour-18')).toMatchObject({ name: 'B 306', floor: 3, areaM2: 86 })
    expect(byId('space-tampere-hervanta-12')).toMatchObject({ name: 'Storage 6', type: 'storage', areaM2: 30 })
    expect(byId('space-helsinki-kallio-16')).toMatchObject({ name: 'A 16', type: 'apartment', floor: 4, areaM2: 77 })
    expect(byId('space-helsinki-kallio-1')?.createdAt).toBe(properties[3]!.createdAt)
  })

  it('gives the spaces the rooms and features of the frontend seed', () => {
    const { spaces } = createDemoData(now)
    const byId = (id: string) => spaces.find((space) => space.id === id)

    expect(byId('space-joensuu-center-1')).toMatchObject({ rooms: null, features: ['accessible'] })
    expect(byId('space-joensuu-center-5')).toMatchObject({ rooms: 4, features: ['accessible', 'kitchen'] })
    expect(byId('space-kuopio-harbour-18')).toMatchObject({
      rooms: null,
      features: ['sauna', 'parking', 'accessible', 'kitchen'],
    })
    expect(byId('space-tampere-hervanta-1')).toMatchObject({ features: ['parking', 'accessible', 'loading_dock'] })
    expect(byId('space-helsinki-kallio-4')).toMatchObject({
      rooms: 3,
      features: ['sauna', 'parking', 'accessible', 'kitchen'],
    })
    expect(byId('space-helsinki-kallio-11')).toMatchObject({
      name: 'A 11',
      rooms: 3,
      features: ['sauna', 'balcony', 'kitchen'],
      status: 'available',
    })
  })

  it('has spaces that pass the same validation as data sent by clients', () => {
    const { properties, spaces } = createDemoData(now)
    for (const space of spaces) {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = space
      expect(parseSpaceInput(input)).toEqual({ ok: true, values: input })
      const propertyExists = properties.some(({ id }) => id === space.propertyId)
      expect(checkSpaceReferences(input, { propertyExists, spaces, maintenance: [], existing: space })).toEqual({})
    }
  })

  it('has the 14 demo maintenance tasks of the frontend seed', () => {
    const { maintenance } = createDemoData(now)
    const count = (status: string) => maintenance.filter((task) => task.status === status).length

    expect(maintenance.map(({ id }) => id)).toEqual(Array.from({ length: 14 }, (_, index) => `maintenance-${index + 1}`))
    expect(count('open')).toBe(6)
    expect(count('in_progress')).toBe(4)
    expect(count('completed')).toBe(4)
  })

  it('dates the tasks relative to now and keeps completedAt in step with the status', () => {
    const { maintenance } = createDemoData(now)

    expect(maintenance[0]).toMatchObject({
      propertyId: 'property-joensuu-center',
      spaceId: 'space-joensuu-center-16',
      title: 'Water damage in office ceiling',
      status: 'in_progress',
      dueDate: '2026-09-26',
      completedAt: null,
      createdAt: '2026-09-16T10:30:00.000Z',
      updatedAt: '2026-09-16T10:30:00.000Z',
    })
    expect(maintenance[3]).toMatchObject({
      spaceId: null,
      status: 'completed',
      dueDate: '2026-08-28',
      completedAt: '2026-08-23T10:30:00.000Z',
      updatedAt: '2026-08-23T10:30:00.000Z',
    })
    for (const task of maintenance) expect(task.completedAt !== null).toBe(task.status === 'completed')
  })

  it('has tasks that pass the same validation as data sent by clients', () => {
    const { properties, spaces, maintenance } = createDemoData(now)
    for (const task of maintenance) {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, completedAt: _completedAt, ...input } = task
      expect(parseMaintenanceInput(input)).toEqual({ ok: true, values: input })
      const propertyExists = properties.some(({ id }) => id === task.propertyId)
      expect(checkMaintenanceReferences(input, { propertyExists, spaces })).toEqual({})
    }
  })

  it('has the 31 demo tenants of the frontend seed', () => {
    const { tenants } = createDemoData(now)

    expect(tenants).toHaveLength(31)
    expect(tenants.filter((tenant) => tenant.type === 'company')).toHaveLength(16)
    expect(tenants[0]).toEqual({
      id: 'tenant-nordic-pixel',
      type: 'company',
      name: 'Nordic Pixel Oy',
      contactPerson: 'Aleksi Rautio',
      email: 'info@nordic-pixel.example',
      phone: null,
      notes: 'Software development company.',
      createdAt: '2024-10-22T10:30:00.000Z',
      updatedAt: '2024-10-22T10:30:00.000Z',
    })
    expect(tenants.find(({ id }) => id === 'tenant-laura-makinen')).toMatchObject({
      type: 'person',
      name: 'Laura Mäkinen',
      contactPerson: null,
      email: 'laura.makinen@example.com',
    })
  })

  it('has tenants that pass the same validation as data sent by clients', () => {
    const { tenants } = createDemoData(now)
    for (const tenant of tenants) {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = tenant
      expect(parseTenantInput(input)).toEqual({ ok: true, values: input })
      expect(checkTenantEmail(input.email, tenants, tenant.id)).toEqual({})
    }
  })

  it('has the 62 demo leases of the frontend seed', () => {
    const { leases } = createDemoData(now)
    const today = toIsoDate(now)
    const count = (status: string) => leases.filter((lease) => getLeaseStatus(lease, today) === status).length

    expect(leases).toHaveLength(62)
    expect(count('active')).toBe(58)
    expect(count('upcoming')).toBe(1)
    expect(count('ended')).toBe(3)
    expect(leases[0]).toEqual({
      id: 'lease-1',
      tenantId: 'tenant-jarvi-coffee',
      spaceId: 'space-joensuu-center-1',
      startDate: '2026-06-24',
      endDate: '2027-03-21',
      monthlyRentCents: 364000,
      createdAt: '2026-06-24T09:00:00.000Z',
      updatedAt: '2026-06-24T09:00:00.000Z',
    })
  })

  it('follows the lease rules: occupied exactly with an active lease, no overlaps', () => {
    const { spaces, leases, tenants } = createDemoData(now)
    const today = toIsoDate(now)

    expect(reconcileSpaceStatuses(spaces, leases, today)).toEqual([])
    for (const lease of leases) {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = lease
      expect(parseLeaseInput(input)).toEqual({ ok: true, values: input })
      const space = spaces.find(({ id }) => id === lease.spaceId) ?? null
      const tenantExists = tenants.some(({ id }) => id === lease.tenantId)
      expect(checkLeaseReferences(input, { tenantExists, space, leases, today, editingId: lease.id })).toEqual({})
    }
  })

  it('gives every demo tenant a lease, so none can be deleted', () => {
    const { tenants, leases } = createDemoData(now)
    for (const tenant of tenants) expect(checkTenantDeletion(tenant.id, leases).allowed).toBe(false)
  })

  it('replaces all data with the demo data on reset', async () => {
    const store = createMemoryStore()
    const demo = createDemoData(now)
    await store.properties.insert({ ...demo.properties[0]!, id: 'mine', name: 'Mine' })
    await store.spaces.insert({ ...demo.spaces[0]!, id: 'space-mine', propertyId: 'mine' })
    await store.maintenance.insert(maintenanceTask({ id: 'task-mine', propertyId: 'mine' }))
    await store.leases.insert(lease({ id: 'lease-mine', tenantId: 'tenant-mine', spaceId: 'space-mine' }))
    await store.tenants.insert({ ...demo.tenants[0]!, id: 'tenant-mine', email: 'mine@example.com' })

    await resetDemoData(store, now)

    expect(await store.properties.list()).toEqual(demo.properties)
    expect(await store.spaces.list()).toEqual(demo.spaces)
    expect(await store.maintenance.list()).toEqual(demo.maintenance)
    expect(await store.tenants.list()).toEqual(demo.tenants)
    expect(await store.leases.list()).toEqual(demo.leases)
  })
})
