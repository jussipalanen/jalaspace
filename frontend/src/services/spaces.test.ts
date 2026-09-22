import { describe, expect, it } from 'vitest'
import { createSeedData } from '../data/seed'
import { toIsoDate } from '../utils/date'
import {
  applySpaceChanges,
  buildNewSpace,
  buildSpaceRows,
  checkSpaceDeletion,
  emptySpaceForm,
  filterSpaceRows,
  findActiveLease,
  parseArea,
  parseFloor,
  reconcileSpaceStatuses,
  resolveSpaceStatus,
  toSpaceForm,
  validateSpaceForm,
  type SpaceFormValues,
} from './spaces'

const now = new Date('2026-09-22T10:30:00.000Z')
const today = toIsoDate(now)
const seed = createSeedData(now)
const valid: SpaceFormValues = {
  propertyId: 'property-joensuu-center',
  name: 'A 501',
  type: 'office',
  floor: '5',
  area: '62,5',
  status: 'available',
}

describe('parsing floor and area', () => {
  it.each([
    ['2', 2],
    [' -1 ', -1],
    ['−1', -1],
    ['0', 0],
    ['-10', -10],
    ['200', 200],
  ])('parses the floor "%s"', (input, expected) => {
    expect(parseFloor(input)).toBe(expected)
  })

  it.each(['2.5', 'two', '', '-11', '201', '1e2'])('rejects the floor "%s"', (input) => {
    expect(parseFloor(input)).toBeNull()
  })

  it.each([
    ['62', 62],
    ['62,5', 62.5],
    ['62.25', 62.25],
    ['1 250', 1250],
    ['100000', 100000],
  ])('parses the area "%s"', (input, expected) => {
    expect(parseArea(input)).toBe(expected)
  })

  it.each(['0', '-5', '62,555', 'abc', '100001', '1,2,3'])('rejects the area "%s"', (input) => {
    expect(parseArea(input)).toBeNull()
  })
})

describe('validateSpaceForm', () => {
  it('accepts a valid space', () => {
    expect(validateSpaceForm(valid, seed.spaces)).toEqual({})
  })

  it('requires property, name, floor and area', () => {
    expect(validateSpaceForm({ ...emptySpaceForm(), floor: '' }, seed.spaces)).toEqual({
      propertyId: 'required',
      name: 'required',
      floor: 'required',
      area: 'required',
    })
  })

  it('rejects a name already used in the same property, ignoring case', () => {
    expect(validateSpaceForm({ ...valid, name: ' a 201 ' }, seed.spaces).name).toBe('duplicate')
  })

  it('allows the same name in another property and when editing the space itself', () => {
    expect(
      validateSpaceForm({ ...valid, propertyId: 'property-kuopio-harbour', name: 'A 201' }, seed.spaces),
    ).toEqual({})
    expect(
      validateSpaceForm({ ...valid, name: 'A 201' }, seed.spaces, 'space-joensuu-center-5'),
    ).toEqual({})
  })

  it('reports invalid numbers and long names', () => {
    expect(
      validateSpaceForm({ ...valid, floor: '2.5', area: '0', name: 'x'.repeat(51) }, seed.spaces),
    ).toEqual({ floor: 'invalid', area: 'invalid', name: 'tooLong' })
  })
})

describe('status rule', () => {
  it('forces occupied while a lease is active and forbids it otherwise', () => {
    expect(resolveSpaceStatus('available', true)).toBe('occupied')
    expect(resolveSpaceStatus('maintenance', true)).toBe('occupied')
    expect(resolveSpaceStatus('occupied', false)).toBe('available')
    expect(resolveSpaceStatus('maintenance', false)).toBe('maintenance')
  })

  it('finds the active lease of a space', () => {
    const occupied = seed.spaces.find((space) => space.status === 'occupied')!
    const available = seed.spaces.find((space) => space.status === 'available')!
    expect(findActiveLease(occupied.id, seed.leases, today)?.spaceId).toBe(occupied.id)
    expect(findActiveLease(available.id, seed.leases, today)).toBeNull()
  })
})

describe('building spaces', () => {
  it('creates a trimmed space with parsed numbers, never occupied', () => {
    const space = buildNewSpace({ ...valid, name: ' A 501 ', status: 'occupied' }, now.toISOString())
    expect(space).toMatchObject({
      name: 'A 501',
      floor: 5,
      areaM2: 62.5,
      status: 'available',
      createdAt: now.toISOString(),
    })
    expect(space.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('keeps an occupied space occupied when edited', () => {
    const occupied = seed.spaces.find((space) => space.status === 'occupied')!
    const edited = applySpaceChanges(
      occupied,
      { ...toSpaceForm(occupied, 'en-GB'), status: 'available', area: '99' },
      true,
      now.toISOString(),
    )
    expect(edited).toMatchObject({ status: 'occupied', areaM2: 99, id: occupied.id })
    expect(edited.createdAt).toBe(occupied.createdAt)
  })

  it('shows the area with the locale decimal separator in the form', () => {
    const space = { ...seed.spaces[0]!, areaM2: 62.5 }
    expect(toSpaceForm(space, 'fi-FI').area).toBe('62,5')
    expect(toSpaceForm(space, 'en-GB').area).toBe('62.5')
  })
})

describe('space rows and filters', () => {
  const rows = buildSpaceRows(seed.spaces, seed.properties, seed.leases, seed.tenants, today, 'en-GB')

  it('adds the property and the current tenant', () => {
    expect(rows).toHaveLength(68)
    const occupied = rows.filter((row) => row.space.status === 'occupied')
    expect(occupied.every((row) => row.tenant !== null)).toBe(true)
    expect(rows.filter((row) => row.space.status !== 'occupied').every((row) => !row.tenant)).toBe(
      true,
    )
    expect(rows[0]?.property?.name).toBe('Helsinki Kallio Residences')
  })

  it('filters by property, status and search', () => {
    const filter = (propertyId = '', status: '' | 'available' = '', query = '') =>
      filterSpaceRows(rows, { propertyId, status, query }, 'en-GB')

    expect(filter()).toHaveLength(68)
    expect(filter('', 'available')).toHaveLength(7)
    expect(filter('property-joensuu-center', 'available')).toHaveLength(2)
    expect(filter('', '', 'a 20').map((row) => row.space.name)).toEqual([
      'A 201',
      'A 202',
      'A 203',
      'A 204',
      'A 205',
      'A 206',
    ])
    expect(filter('', '', 'NORDIC')).toHaveLength(6)
  })
})

describe('checkSpaceDeletion', () => {
  it('blocks deleting a space that has leases or maintenance tasks', () => {
    expect(checkSpaceDeletion('space-joensuu-center-16', seed.leases, seed.maintenance)).toEqual({
      allowed: false,
      leaseCount: 0,
      maintenanceCount: 1,
    })
    expect(checkSpaceDeletion('space-joensuu-center-5', seed.leases, seed.maintenance).allowed).toBe(
      false,
    )
  })

  it('allows deleting a space nothing refers to', () => {
    expect(checkSpaceDeletion('new-space', seed.leases, seed.maintenance)).toEqual({
      allowed: true,
      leaseCount: 0,
      maintenanceCount: 0,
    })
  })
})

describe('reconciling space statuses with leases', () => {
  it('changes nothing when the statuses match the leases', () => {
    expect(reconcileSpaceStatuses(seed.spaces, seed.leases, today)).toEqual([])
  })

  it('frees a space whose lease has ended and occupies one whose lease has started', () => {
    // Later, A 202's lease has ended and Aurora Yoga's lease of A 302 has started.
    const leases = seed.leases.map((lease) =>
      lease.spaceId === 'space-joensuu-center-6' ? { ...lease, endDate: '2026-09-21' } : lease,
    )
    const changed = reconcileSpaceStatuses(seed.spaces, leases, '2026-11-06')
    expect(changed.map((space) => [space.name, space.status])).toEqual(
      expect.arrayContaining([
        ['A 202', 'available'],
        ['A 302', 'occupied'],
      ]),
    )
  })

  it('keeps a space in maintenance when no lease is active', () => {
    const inMaintenance = seed.spaces.filter((space) => space.status === 'maintenance')
    expect(reconcileSpaceStatuses(inMaintenance, [], today)).toEqual([])
  })
})
