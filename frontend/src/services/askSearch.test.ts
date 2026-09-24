import { describe, expect, it } from 'vitest'
import { createSeedData } from '../data/seed'
import { toIsoDate } from '../utils/date'
import type { AskSearch } from './ask'
import { listPageLink, runAskSearch, type AskResults } from './askSearch'
import { isMaintenanceOverdue } from './maintenance'

const now = new Date('2026-09-22T10:30:00.000Z')
const today = toIsoDate(now)
const data = createSeedData(now)

const search = (area: AskSearch['area'], filter: AskSearch['filter'], sort?: AskSearch['sort']): AskSearch => ({
  kind: 'search',
  area,
  filter,
  ...(sort ? { sort } : {}),
  ignored: [],
})

const run = (query: AskSearch): AskResults => runAskSearch(data, query, today, 'en-GB')

function spaceNames(query: AskSearch): string[] {
  const results = run(query)
  if (results.area !== 'spaces') throw new Error('Expected spaces')
  return results.rows.map((row) => row.space.name)
}

describe('ask search', () => {
  it('finds three-room apartments with a sauna, and the available one', () => {
    const filter = { types: ['apartment'], rooms: { min: 3, max: 3 }, features: ['sauna'] }
    expect(spaceNames(search('spaces', filter))).toEqual(['A 4', 'A 8', 'A 11', 'A 12', 'A 15', 'A 16'])
    expect(spaceNames(search('spaces', { ...filter, statuses: ['available'] }))).toEqual(['A 11'])
  })

  it('requires every feature, and any of the listed types', () => {
    expect(spaceNames(search('spaces', { features: ['sauna', 'parking'] }))).toEqual(['A 4', 'A 8', 'B 306'])
    const officesAndRetail = spaceNames(search('spaces', { types: ['office', 'retail'], city: 'joensuu' }))
    expect(officesAndRetail).toHaveLength(22)
  })

  it('sorts as asked, with rows missing the value last', () => {
    const largestFirst = search(
      'spaces',
      { types: ['apartment'], features: ['sauna'] },
      { by: 'areaM2', direction: 'desc' },
    )
    expect(spaceNames(largestFirst)).toEqual(['A 16', 'A 12', 'A 8', 'A 4', 'A 15', 'A 11'])

    const byRent = spaceNames(search('spaces', { city: 'Tampere' }, { by: 'monthlyRentEur', direction: 'asc' }))
    // Spaces without an active lease have no rent and come last.
    expect(byRent.slice(-2)).toEqual(expect.arrayContaining(['Hall 4', 'Storage 2']))
  })

  it('matches ranges only for spaces that have the value', () => {
    const names = spaceNames(search('spaces', { rooms: { min: 1 } }))
    expect(names).toHaveLength(34)
    expect(names).not.toContain('Hall 1')
  })

  it('uses derived values such as occupancy', () => {
    const results = run(search('properties', { occupancyPercent: { max: 90 } }))
    if (results.area !== 'properties') throw new Error('Expected properties')
    expect(results.rows.length).toBeGreaterThan(0)
    expect(results.rows.every((row) => row.occupancyPercent !== null && row.occupancyPercent <= 90)).toBe(true)
  })

  it('finds tenants by lease status and where they rent', () => {
    const none = run(search('tenants', { leaseStatuses: ['none'] }))
    // Every seed tenant has a lease.
    expect(none.rows).toHaveLength(0)

    const inHelsinki = run(search('tenants', { types: ['person'], city: 'Helsinki' }))
    if (inHelsinki.area !== 'tenants') throw new Error('Expected tenants')
    expect(inHelsinki.rows.map((row) => row.tenant.name)).toContain('Aino Virtanen')
    expect(inHelsinki.rows.every((row) => row.tenant.type === 'person')).toBe(true)
  })

  it('finds leases by dates and open end', () => {
    const results = run(search('leases', { endDate: { from: today, to: '2027-06-30' }, openEnded: false }))
    if (results.area !== 'leases') throw new Error('Expected leases')
    expect(results.rows.length).toBeGreaterThan(0)
    expect(results.rows.every(({ lease }) => lease.endDate !== null && lease.endDate >= today)).toBe(true)
  })

  it('finds overdue high-priority maintenance', () => {
    const results = run(search('maintenance', { overdue: true, priorities: ['high'] }))
    if (results.area !== 'maintenance') throw new Error('Expected maintenance')
    const expected = data.maintenance.filter((task) => isMaintenanceOverdue(task, today) && task.priority === 'high')
    expect(results.rows.map((row) => row.task.id).toSorted()).toEqual(expected.map((task) => task.id).toSorted())
  })

  it('lists everything in an area for an empty filter', () => {
    expect(run(search('tenants', {})).rows).toHaveLength(data.tenants.length)
  })
})

describe('list page links', () => {
  it("uses the list page's own filters when they can express the search", () => {
    expect(listPageLink(search('spaces', {}))).toBe('/units')
    expect(listPageLink(search('spaces', { rooms: { min: 3, max: 3 }, features: ['sauna', 'parking'] }))).toBe(
      '/units?rooms=3&features=sauna%2Cparking',
    )
    expect(listPageLink(search('spaces', { rooms: { min: 5 }, statuses: ['available'] }))).toBe(
      '/units?rooms=5&status=available',
    )
    expect(listPageLink(search('maintenance', { overdue: true, priorities: ['high'] }))).toBe(
      '/maintenance?overdue=1&priority=high',
    )
    expect(listPageLink(search('tenants', { types: ['company'] }))).toBe('/tenants?type=company')
    expect(listPageLink(search('leases', { statuses: ['active'] }))).toBe('/leases?status=active')
  })

  it('gives no link when the list page cannot show the same results', () => {
    expect(listPageLink(search('spaces', { types: ['apartment'] }))).toBeNull()
    expect(listPageLink(search('spaces', { rooms: { min: 2 } }))).toBeNull()
    expect(listPageLink(search('spaces', { statuses: ['available', 'maintenance'] }))).toBeNull()
    expect(listPageLink(search('properties', { city: 'Helsinki' }))).toBeNull()
  })
})
