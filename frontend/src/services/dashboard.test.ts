import { describe, expect, it } from 'vitest'
import { createSeedData } from '../data/seed'
import { toIsoDate } from '../utils/date'
import { ACTIVITY_LIMIT, buildDashboardSummary, DASHBOARD_LIST_LIMIT } from './dashboard'

const now = new Date('2026-09-22T10:30:00.000Z')
const today = toIsoDate(now)
const seed = createSeedData(now)
const summary = buildDashboardSummary(seed, today)

const empty = { properties: [], spaces: [], tenants: [], leases: [], maintenance: [] }

describe('buildDashboardSummary', () => {
  it('calculates the key figures from the seed data', () => {
    expect(summary.stats).toEqual({
      propertyCount: 4,
      cityCount: 4,
      spaceCount: 68,
      availableSpaceCount: 7,
      occupiedSpaceCount: 58,
      occupancyPercent: 85,
      openMaintenanceCount: 10,
      highPriorityOpenCount: 4,
    })
  })

  it('follows the data instead of fixed numbers', () => {
    const spaces = seed.spaces.map((space) =>
      space.status === 'available' ? { ...space, status: 'occupied' as const } : space,
    )
    const maintenance = seed.maintenance.map((task) => ({
      ...task,
      status: 'completed' as const,
    }))

    const { stats } = buildDashboardSummary({ ...seed, spaces, maintenance }, today)

    expect(stats.occupiedSpaceCount).toBe(65)
    expect(stats.occupancyPercent).toBe(96)
    expect(stats.availableSpaceCount).toBe(0)
    expect(stats.openMaintenanceCount).toBe(0)
    expect(stats.highPriorityOpenCount).toBe(0)
  })

  it('counts cities case-insensitively', () => {
    const [first, second] = seed.properties
    const { stats } = buildDashboardSummary(
      { ...empty, properties: [first!, { ...second!, city: first!.city.toUpperCase() }] },
      today,
    )
    expect(stats.cityCount).toBe(1)
  })

  it('handles an empty portfolio', () => {
    const result = buildDashboardSummary(empty, today)
    expect(result.stats.occupancyPercent).toBeNull()
    expect(result.stats.spaceCount).toBe(0)
    expect(result.recentMaintenance).toEqual([])
    expect(result.availableSpaces).toEqual([])
    expect(result.recentActivity).toEqual([])
  })

  it('lists the newest maintenance tasks with their property and space', () => {
    expect(summary.recentMaintenance).toHaveLength(DASHBOARD_LIST_LIMIT)
    const created = summary.recentMaintenance.map((item) => item.task.createdAt)
    expect(created).toEqual(created.toSorted().reverse())

    const first = summary.recentMaintenance[0]!
    expect(first.task.title).toBe('Main entrance door closer broken')
    expect(first.property?.name).toBe('Joensuu Center')
    expect(first.space).toBeNull()

    const withSpace = summary.recentMaintenance.find((item) => item.task.spaceId !== null)!
    expect(withSpace.space?.propertyId).toBe(withSpace.task.propertyId)
  })

  it('lists all available spaces sorted by property and space name', () => {
    expect(summary.availableSpaces).toHaveLength(7)
    expect(summary.availableSpaces.every((item) => item.space.status === 'available')).toBe(true)

    const labels = summary.availableSpaces.map((i) => `${i.property?.name} ${i.space.name}`)
    expect(labels[0]).toBe('Helsinki Kallio Residences A 11')
    expect(labels).toContain('Joensuu Center A 302')
  })

  it('marks spaces with an upcoming lease as reserved', () => {
    const reserved = summary.availableSpaces.filter((item) => item.reservedFrom !== null)
    expect(reserved).toHaveLength(1)
    expect(reserved[0]?.space.name).toBe('A 302')
    expect(reserved[0]!.reservedFrom! > today).toBe(true)
  })

  it('derives recent activity, newest first, without future events', () => {
    const activity = summary.recentActivity
    expect(activity).toHaveLength(ACTIVITY_LIMIT)

    const dates = activity.map((item) => item.date)
    expect(dates).toEqual(dates.toSorted().reverse())
    expect(dates.every((date) => date <= today)).toBe(true)

    expect(activity[0]).toMatchObject({
      type: 'maintenance_completed',
      title: 'Maintenance task completed',
      details: 'Roof snow removal, Tampere Hervanta Logistics',
    })
    expect(activity.some((item) => item.type === 'lease_ended')).toBe(true)
    expect(activity.every((item) => item.href.startsWith('/'))).toBe(true)
  })

  it('reports a lease start on its start date', () => {
    const lease = { ...seed.leases[0]!, startDate: today, endDate: null }
    const { recentActivity } = buildDashboardSummary({ ...seed, leases: [lease] }, today)

    expect(recentActivity[0]).toMatchObject({ type: 'lease_started', date: today })
    expect(recentActivity[0]?.href).toBe(`/tenants/${lease.tenantId}`)
  })
})
