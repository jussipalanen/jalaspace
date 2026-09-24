import { describe, expect, it } from 'vitest'
import type { Space } from './spaces.ts'
import {
  checkLeaseReferences,
  getLeaseStatus,
  hasActiveLease,
  parseLeaseInput,
  periodsOverlap,
  reconcileSpaceStatuses,
  type LeaseInput,
} from './leases.ts'

const valid: LeaseInput = {
  tenantId: 'tenant-1',
  spaceId: 'space-1',
  startDate: '2026-10-01',
  endDate: '2027-09-30',
  monthlyRentCents: 125050,
}

const withField = (field: keyof LeaseInput, value: unknown) => parseLeaseInput({ ...valid, [field]: value })

describe('lease status', () => {
  const lease = { startDate: '2026-10-01', endDate: '2026-12-31' }

  it('is upcoming before the start, active through the end date and ended after it', () => {
    expect(getLeaseStatus(lease, '2026-09-30')).toBe('upcoming')
    expect(getLeaseStatus(lease, '2026-10-01')).toBe('active')
    expect(getLeaseStatus(lease, '2026-12-31')).toBe('active')
    expect(getLeaseStatus(lease, '2027-01-01')).toBe('ended')
  })

  it('never ends for an open-ended lease', () => {
    expect(getLeaseStatus({ ...lease, endDate: null }, '2099-01-01')).toBe('active')
  })
})

describe('lease periods', () => {
  const period = (startDate: string, endDate: string | null) => ({ startDate, endDate })

  it('overlap when they share at least one day', () => {
    expect(periodsOverlap(period('2026-01-01', '2026-06-30'), period('2026-06-30', null))).toBe(true)
    expect(periodsOverlap(period('2026-01-01', null), period('2030-01-01', '2030-12-31'))).toBe(true)
    expect(periodsOverlap(period('2026-01-01', '2026-06-30'), period('2026-07-01', null))).toBe(false)
    expect(periodsOverlap(period('2026-07-01', null), period('2026-01-01', '2026-06-30'))).toBe(false)
  })
})

describe('lease input', () => {
  it('accepts valid input and trims the ids', () => {
    expect(parseLeaseInput({ ...valid, tenantId: ' tenant-1 ' })).toEqual({ ok: true, values: valid })
  })

  it('ignores fields the client may not set', () => {
    const result = parseLeaseInput({ ...valid, id: 'mine', status: 'ended', createdAt: 'yesterday' })
    expect(result).toEqual({ ok: true, values: valid })
  })

  it.each([undefined, null, ''])('treats the end date %j as open-ended and the rent %j as none', (empty) => {
    expect(parseLeaseInput({ ...valid, endDate: empty, monthlyRentCents: empty })).toEqual({
      ok: true,
      values: { ...valid, endDate: null, monthlyRentCents: null },
    })
  })

  it('allows a lease of one day', () => {
    expect(withField('endDate', valid.startDate).ok).toBe(true)
  })

  it('reports every missing required field', () => {
    expect(parseLeaseInput({})).toEqual({
      ok: false,
      errors: { tenantId: 'required', spaceId: 'required', startDate: 'required' },
    })
  })

  it.each([undefined, null, 'text', 42, ['tenantId']])('treats the body %j as empty', (body) => {
    const result = parseLeaseInput(body)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors.startDate).toBe('required')
  })

  it.each(['2026-02-30', '1.10.2026', '2026-10-01T00:00:00.000Z', 20261001])('rejects the start date %j', (startDate) => {
    expect(withField('startDate', startDate)).toEqual({ ok: false, errors: { startDate: 'invalid' } })
  })

  it('rejects an end date that is invalid or before the start', () => {
    expect(withField('endDate', '2027-02-29')).toEqual({ ok: false, errors: { endDate: 'invalid' } })
    expect(withField('endDate', '2026-09-30')).toEqual({ ok: false, errors: { endDate: 'beforeStart' } })
  })

  it('does not compare the end date with an invalid start date', () => {
    expect(parseLeaseInput({ ...valid, startDate: 'soon', endDate: '2020-01-01' })).toEqual({
      ok: false,
      errors: { startDate: 'invalid' },
    })
  })

  it.each([1, 100_000_000])('accepts a rent of %d cents', (monthlyRentCents) => {
    expect(withField('monthlyRentCents', monthlyRentCents).ok).toBe(true)
  })

  it.each([0, -100, 100_000_001, 1250.5, '125050', Number.NaN])('rejects the rent %j', (monthlyRentCents) => {
    expect(withField('monthlyRentCents', monthlyRentCents)).toEqual({
      ok: false,
      errors: { monthlyRentCents: 'invalid' },
    })
  })
})

describe('lease references', () => {
  const today = '2026-09-23'
  const available = { id: 'space-1', status: 'available' as const }
  const data = { tenantExists: true, space: available, leases: [], today }
  const other = { id: 'lease-other', spaceId: 'space-1', startDate: '2025-01-01', endDate: '2026-09-30' }

  it('accepts a lease for an existing tenant and space', () => {
    expect(checkLeaseReferences(valid, data)).toEqual({})
  })

  it('requires the tenant and space to exist', () => {
    expect(checkLeaseReferences(valid, { ...data, tenantExists: false, space: null })).toEqual({
      tenantId: 'notFound',
      spaceId: 'notFound',
    })
  })

  it('rejects a period that overlaps another lease of the space', () => {
    const overlapping = { ...valid, startDate: '2026-09-30' }
    expect(checkLeaseReferences(overlapping, { ...data, leases: [other] })).toEqual({ spaceId: 'overlap' })
    // The lease being edited does not overlap with itself, and other spaces do not count.
    expect(checkLeaseReferences(overlapping, { ...data, leases: [other], editingId: 'lease-other' })).toEqual({})
    expect(checkLeaseReferences(overlapping, { ...data, leases: [{ ...other, spaceId: 'space-2' }] })).toEqual({})
    // The next day is free.
    expect(checkLeaseReferences(valid, { ...data, leases: [other] })).toEqual({})
  })

  it('does not start an active lease on a space in maintenance', () => {
    const inMaintenance = { ...data, space: { id: 'space-1', status: 'maintenance' as const } }
    expect(checkLeaseReferences({ ...valid, startDate: today }, inMaintenance)).toEqual({ spaceId: 'maintenance' })
    // An upcoming or past lease is fine: the maintenance may be over by then.
    expect(checkLeaseReferences(valid, inMaintenance)).toEqual({})
    expect(checkLeaseReferences({ ...valid, startDate: '2020-01-01', endDate: '2020-12-31' }, inMaintenance)).toEqual(
      {},
    )
  })
})

describe('space statuses', () => {
  const today = '2026-09-23'
  const space = (id: string, status: Space['status']): Space => ({
    id,
    propertyId: 'property-1',
    name: id,
    type: 'office',
    floor: 1,
    areaM2: 50,
    rooms: null,
    features: [],
    status,
    createdAt: '',
    updatedAt: '',
  })
  const leases = [
    { spaceId: 'active', startDate: '2026-01-01', endDate: null },
    { spaceId: 'upcoming', startDate: '2026-10-01', endDate: null },
    { spaceId: 'ended', startDate: '2025-01-01', endDate: '2026-09-22' },
  ]

  it('knows which spaces have an active lease today', () => {
    expect(['active', 'upcoming', 'ended', 'none'].filter((id) => hasActiveLease(id, leases, today))).toEqual([
      'active',
    ])
  })

  it('corrects the spaces whose status no longer matches their leases', () => {
    const spaces = [
      space('active', 'available'),
      space('upcoming', 'occupied'),
      space('ended', 'occupied'),
      space('none', 'maintenance'),
    ]
    expect(reconcileSpaceStatuses(spaces, leases, today)).toEqual([
      space('active', 'occupied'),
      space('upcoming', 'available'),
      space('ended', 'available'),
    ])
  })
})
