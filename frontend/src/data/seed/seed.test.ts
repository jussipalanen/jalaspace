import { describe, expect, it } from 'vitest'
import { getLeaseStatus } from '../../services/leases'
import { toIsoDate } from '../../utils/date'
import { createSeedData } from '.'

const now = new Date('2026-09-22T10:30:00.000Z')
const today = toIsoDate(now)
const data = createSeedData(now)

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

describe('seed data', () => {
  it('contains a realistic demo portfolio', () => {
    expect(data.properties).toHaveLength(4)
    expect(data.spaces).toHaveLength(68)
    expect(data.tenants).toHaveLength(31)
    expect(data.leases).toHaveLength(62)
    expect(data.maintenance).toHaveLength(14)
  })

  it('has a mix of space statuses', () => {
    const count = (status: string) => data.spaces.filter((s) => s.status === status).length
    expect(count('occupied')).toBe(58)
    expect(count('available')).toBe(7)
    expect(count('maintenance')).toBe(3)
  })

  it('has a mix of lease and maintenance statuses', () => {
    const leaseStatuses = data.leases.map((lease) => getLeaseStatus(lease, today))
    expect(leaseStatuses.filter((s) => s === 'active')).toHaveLength(58)
    expect(leaseStatuses.filter((s) => s === 'upcoming')).toHaveLength(1)
    expect(leaseStatuses.filter((s) => s === 'ended')).toHaveLength(3)

    const taskStatuses = data.maintenance.map((task) => task.status)
    expect(taskStatuses.filter((s) => s === 'open')).toHaveLength(6)
    expect(taskStatuses.filter((s) => s === 'in_progress')).toHaveLength(4)
    expect(taskStatuses.filter((s) => s === 'completed')).toHaveLength(4)
  })

  it('uses unique ids across all entities', () => {
    const ids = Object.values(data).flatMap((items: { id: string }[]) => items.map((i) => i.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only references entities that exist', () => {
    const propertyIds = new Set(data.properties.map((p) => p.id))
    const spaceById = new Map(data.spaces.map((s) => [s.id, s]))
    const tenantIds = new Set(data.tenants.map((t) => t.id))

    for (const space of data.spaces) expect(propertyIds).toContain(space.propertyId)
    for (const lease of data.leases) {
      expect(tenantIds).toContain(lease.tenantId)
      expect(spaceById.has(lease.spaceId)).toBe(true)
    }
    for (const task of data.maintenance) {
      expect(propertyIds).toContain(task.propertyId)
      if (task.spaceId !== null) {
        // A task's space must belong to the task's property.
        expect(spaceById.get(task.spaceId)?.propertyId).toBe(task.propertyId)
      }
    }
  })

  it('marks a space occupied exactly when it has one active lease', () => {
    for (const space of data.spaces) {
      const activeLeases = data.leases.filter(
        (lease) => lease.spaceId === space.id && getLeaseStatus(lease, today) === 'active',
      )
      expect(activeLeases.length, space.id).toBe(space.status === 'occupied' ? 1 : 0)
    }
  })

  it('keeps every tenant connected to at least one lease', () => {
    const leasedTenants = new Set(data.leases.map((lease) => lease.tenantId))
    for (const tenant of data.tenants) expect(leasedTenants, tenant.name).toContain(tenant.id)
  })

  it('sets completedAt only for completed maintenance tasks', () => {
    for (const task of data.maintenance) {
      if (task.status === 'completed') expect(task.completedAt).toMatch(ISO_DATE_TIME)
      else expect(task.completedAt).toBeNull()
    }
  })

  it('stores timestamps and calendar dates in canonical ISO formats', () => {
    const all = Object.values(data).flat() as { createdAt: string; updatedAt: string }[]
    for (const entity of all) {
      expect(entity.createdAt).toMatch(ISO_DATE_TIME)
      expect(entity.updatedAt).toMatch(ISO_DATE_TIME)
      expect(entity.createdAt <= now.toISOString()).toBe(true)
    }
    for (const lease of data.leases) {
      expect(lease.startDate).toMatch(ISO_DATE)
      if (lease.endDate !== null) expect(lease.endDate).toMatch(ISO_DATE)
      expect(lease.monthlyRentCents).toSatisfy(Number.isInteger)
    }
  })

  it('is deterministic for the same date', () => {
    expect(createSeedData(now)).toEqual(data)
  })

  it('moves dates along with the current date', () => {
    const later = createSeedData(new Date('2027-09-22T10:30:00.000Z'))
    expect(later.leases[0]?.startDate).not.toBe(data.leases[0]?.startDate)
  })
})
