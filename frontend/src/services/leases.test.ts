import { describe, expect, it } from 'vitest'
import { createSeedData } from '../data/seed'
import type { Lease } from '../types/lease'
import {
  applyLeaseChanges,
  buildLeaseRows,
  buildNewLease,
  emptyLeaseForm,
  filterLeaseRows,
  findOverlappingLease,
  formatRentInput,
  getLeaseStatus,
  parseMonthlyRent,
  periodsOverlap,
  toLeaseForm,
  validateLeaseForm,
  type LeaseFilters,
  type LeaseFormValues,
} from './leases'

const now = '2026-09-22T10:30:00.000Z'
const today = '2026-09-22'
const seed = createSeedData(new Date(now))
// B 204 in Kuopio Harbour is available and has never been leased.
const valid: LeaseFormValues = {
  tenantId: 'tenant-aino-esimerkki',
  propertyId: 'property-kuopio-harbour',
  spaceId: 'space-kuopio-harbour-10',
  startDate: '1.10.2026',
  endDate: '30.9.2027',
  monthlyRent: '1 250,50',
}
const validate = (values: Partial<LeaseFormValues>, editingId?: string) =>
  validateLeaseForm({ ...valid, ...values }, { ...seed, today, editingId })
const period = (startDate: string, endDate: string | null) => ({ startDate, endDate })

describe('lease status', () => {
  it('counts both the start and the end day', () => {
    expect(getLeaseStatus(period('2026-09-23', null), today)).toBe('upcoming')
    expect(getLeaseStatus(period('2026-09-22', '2026-09-22'), today)).toBe('active')
    expect(getLeaseStatus(period('2026-01-01', '2026-09-21'), today)).toBe('ended')
    expect(getLeaseStatus(period('2026-01-01', null), today)).toBe('active')
  })
})

describe('overlapping periods', () => {
  it('overlap when they share a day; open-ended periods run indefinitely', () => {
    expect(periodsOverlap(period('2026-01-01', '2026-06-30'), period('2026-06-30', null))).toBe(true)
    expect(periodsOverlap(period('2026-01-01', '2026-06-30'), period('2026-07-01', null))).toBe(false)
    expect(periodsOverlap(period('2026-01-01', null), period('2030-01-01', '2030-12-31'))).toBe(true)
    expect(periodsOverlap(period('2027-01-01', null), period('2026-01-01', '2026-12-31'))).toBe(false)
  })

  it('finds another lease of the same space, ignoring the lease being edited', () => {
    const lease45 = seed.leases.find((lease) => lease.id === 'lease-45')!
    expect(findOverlappingLease('space-helsinki-kallio-1', period('2030-01-01', null), seed.leases)?.id).toBe(
      'lease-45',
    )
    expect(
      findOverlappingLease('space-helsinki-kallio-1', period('2030-01-01', null), seed.leases, lease45.id),
    ).toBeNull()
  })
})

describe('monthly rent', () => {
  it('parses euros into cents and formats cents for the form', () => {
    expect(parseMonthlyRent('1 250,50')).toBe(125050)
    expect(parseMonthlyRent('980')).toBe(98000)
    expect(parseMonthlyRent('0')).toBeNull()
    expect(parseMonthlyRent('12,345')).toBeNull()
    expect(parseMonthlyRent('1000001')).toBeNull()
    expect(formatRentInput(125050, 'fi-FI')).toBe('1250,5')
    expect(formatRentInput(125050, 'en-GB')).toBe('1250.5')
    expect(formatRentInput(null, 'en-GB')).toBe('')
  })
})

describe('validating the lease form', () => {
  it('accepts a valid lease and an open-ended one', () => {
    expect(validate({})).toEqual({})
    expect(validate({ endDate: '' })).toEqual({})
  })

  it('requires the tenant, property, space and start date', () => {
    expect(validate({ tenantId: '', propertyId: '', spaceId: '', startDate: '' })).toEqual({
      tenantId: 'required',
      propertyId: 'required',
      startDate: 'required',
    })
    expect(validate({ spaceId: '' })).toEqual({ spaceId: 'required' })
    expect(validate({ tenantId: 'deleted', spaceId: 'space-joensuu-center-5' })).toEqual({
      tenantId: 'notFound',
      spaceId: 'notFound',
    })
  })

  it('checks the dates and the rent', () => {
    expect(validate({ startDate: '31.2.2026', endDate: 'soon', monthlyRent: '-1' })).toEqual({
      startDate: 'invalid',
      endDate: 'invalid',
      monthlyRent: 'invalid',
    })
    expect(validate({ endDate: '30.9.2026' })).toEqual({ endDate: 'beforeStart' })
    // A one-day lease is fine.
    expect(validate({ endDate: '1.10.2026' })).toEqual({})
  })

  it('rejects a period that overlaps another lease of the space', () => {
    // A 202 has an open-ended lease; A 302 is reserved from November.
    expect(
      validate({ propertyId: 'property-joensuu-center', spaceId: 'space-joensuu-center-6', startDate: '1.1.2030', endDate: '' }),
    ).toEqual({ spaceId: 'overlap' })
    expect(
      validate({ propertyId: 'property-joensuu-center', spaceId: 'space-joensuu-center-12', startDate: '1.10.2026', endDate: '31.12.2026' }),
    ).toEqual({ spaceId: 'overlap' })
    // Ending before the reservation starts leaves A 302 free.
    expect(
      validate({ propertyId: 'property-joensuu-center', spaceId: 'space-joensuu-center-12', startDate: '1.10.2026', endDate: '31.10.2026' }),
    ).toEqual({})
  })

  it('rejects a lease active today on a space in maintenance, but allows a later start', () => {
    const inMaintenance = { propertyId: 'property-joensuu-center', spaceId: 'space-joensuu-center-16' }
    expect(validate({ ...inMaintenance, startDate: '22.9.2026', endDate: '' })).toEqual({ spaceId: 'maintenance' })
    expect(validate({ ...inMaintenance, startDate: '1.1.2027', endDate: '' })).toEqual({})
  })

  it('does not treat the lease being edited as an overlap', () => {
    const lease45 = seed.leases.find((lease) => lease.id === 'lease-45')!
    const space = seed.spaces.find((item) => item.id === lease45.spaceId)!
    const form = toLeaseForm(lease45, space, 'fi-FI')
    expect(validate({ ...form, endDate: '31.12.2027' }, 'lease-45')).toEqual({})
    expect(validate({ ...form, endDate: '31.12.2027' })).toEqual({ spaceId: 'overlap' })
  })
})

describe('building leases', () => {
  it('stores dates as date-only strings and the rent in cents', () => {
    expect(buildNewLease(valid, now, 'lease-new')).toEqual({
      id: 'lease-new',
      tenantId: 'tenant-aino-esimerkki',
      spaceId: 'space-kuopio-harbour-10',
      startDate: '2026-10-01',
      endDate: '2027-09-30',
      monthlyRentCents: 125050,
      createdAt: now,
      updatedAt: now,
    })
    expect(buildNewLease({ ...valid, endDate: '', monthlyRent: '' }, now)).toMatchObject({
      endDate: null,
      monthlyRentCents: null,
    })
  })

  it('changes only the period and rent on edits', () => {
    const lease: Lease = buildNewLease(valid, now, 'lease-new')
    const later = '2026-09-25T08:00:00.000Z'
    const edited = applyLeaseChanges(
      lease,
      { ...valid, tenantId: 'someone-else', spaceId: 'elsewhere', endDate: '', monthlyRent: '1300' },
      later,
    )
    expect(edited).toEqual({ ...lease, endDate: null, monthlyRentCents: 130000, updatedAt: later })
  })

  it('prefills today and presets', () => {
    expect(emptyLeaseForm('2026-09-02', { tenantId: 't' })).toMatchObject({ tenantId: 't', startDate: '2.9.2026' })
  })
})

describe('listing leases', () => {
  const rows = buildLeaseRows(seed.leases, seed.tenants, seed.spaces, seed.properties, today, 'en-GB')
  const none: LeaseFilters = { status: '', propertyId: '', query: '' }
  const filter = (filters: Partial<LeaseFilters>) => filterLeaseRows(rows, { ...none, ...filters }, 'en-GB')

  it('joins tenants, spaces and properties, newest start first', () => {
    expect(rows).toHaveLength(62)
    const starts = rows.map((row) => row.lease.startDate)
    expect(starts).toEqual(starts.toSorted().reverse())
    expect(rows[0]).toMatchObject({ status: 'upcoming', tenant: { name: 'Aurora Yoga Studio Oy' }, space: { name: 'A 302' } })
  })

  it('filters by status, property and search', () => {
    expect(filter({ status: 'active' })).toHaveLength(58)
    expect(filter({ status: 'ended' })).toHaveLength(3)
    expect(filter({ propertyId: 'property-tampere-hervanta' })).toHaveLength(10)
    expect(filter({ query: 'aino' }).map((row) => row.lease.id)).toEqual(['lease-45'])
    expect(filter({ query: 'a 302' }).map((row) => row.tenant?.name)).toEqual(['Aurora Yoga Studio Oy'])
  })
})
