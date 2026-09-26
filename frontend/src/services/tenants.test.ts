import { describe, expect, it } from 'vitest'
import { createSeedData } from '../data/seed'
import type { Lease } from '../types/lease'
import {
  applyTenantChanges,
  buildNewTenant,
  buildTenantRows,
  checkTenantDeletion,
  emptyTenantForm,
  filterTenantRows,
  groupTenantLeases,
  planRemoval,
  TENANT_NAME_MAX_LENGTH,
  toTenantForm,
  validateTenantForm,
  type TenantFormValues,
} from './tenants'

const now = '2026-09-22T10:30:00.000Z'
const today = '2026-09-22'
const seed = createSeedData(new Date(now))
const valid: TenantFormValues = {
  ...emptyTenantForm(),
  name: 'Pohjola Bakery Oy',
  contactPerson: 'Liisa Esimerkki',
  email: 'hello@pohjola-bakery.example',
  phone: '+358 40 123 4567',
}
const validate = (values: TenantFormValues, editingId?: string) =>
  validateTenantForm(values, seed.tenants, editingId)

describe('validating the tenant form', () => {
  it('accepts valid values and an empty phone', () => {
    expect(validate(valid)).toEqual({})
    expect(validate({ ...valid, phone: '' })).toEqual({})
    expect(validate({ ...valid, phone: '(013) 123-456' })).toEqual({})
  })

  it('requires a name and a valid email', () => {
    expect(validate({ ...valid, name: '  ', email: '' })).toEqual({ name: 'required', email: 'required' })
    expect(validate({ ...valid, email: 'not-an-email' })).toEqual({ email: 'invalid' })
    expect(validate({ ...valid, name: 'x'.repeat(TENANT_NAME_MAX_LENGTH + 1) })).toEqual({
      name: 'tooLong',
    })
  })

  it('keeps emails unique, ignoring case, except for the tenant being edited', () => {
    expect(validate({ ...valid, email: ' INFO@nordic-pixel.example ' })).toEqual({ email: 'duplicate' })
    expect(validate({ ...valid, email: 'info@nordic-pixel.example' }, 'tenant-nordic-pixel')).toEqual({})
  })

  it('rejects phone numbers with letters or the wrong length', () => {
    expect(validate({ ...valid, phone: '040-CALL-ME' })).toEqual({ phone: 'invalid' })
    expect(validate({ ...valid, phone: '1234' })).toEqual({ phone: 'invalid' })
    expect(validate({ ...valid, phone: '1'.repeat(21) })).toEqual({ phone: 'invalid' })
  })

  it('ignores a contact person for people', () => {
    expect(validate({ ...valid, type: 'person', contactPerson: 'x'.repeat(500) })).toEqual({})
    expect(validate({ ...valid, contactPerson: 'x'.repeat(101) })).toEqual({ contactPerson: 'tooLong' })
  })
})

describe('building tenants', () => {
  it('trims values and stores empty optional fields as null', () => {
    const tenant = buildNewTenant(
      { ...valid, name: ' Pohjola Bakery Oy ', phone: ' ', contactPerson: '', notes: ' Bakery ' },
      now,
    )
    expect(tenant).toMatchObject({
      name: 'Pohjola Bakery Oy',
      contactPerson: null,
      phone: null,
      notes: 'Bakery',
      createdAt: now,
    })
  })

  it('drops the contact person of a person', () => {
    expect(buildNewTenant({ ...valid, type: 'person' }, now).contactPerson).toBeNull()
  })

  it('round-trips a tenant through the form and keeps its identity on edits', () => {
    const tenant = buildNewTenant(valid, now)
    expect(toTenantForm(tenant)).toEqual(valid)
    const later = '2026-09-25T08:00:00.000Z'
    expect(applyTenantChanges(tenant, { ...valid, name: 'Renamed Oy' }, later)).toMatchObject({
      id: tenant.id,
      name: 'Renamed Oy',
      createdAt: now,
      updatedAt: later,
    })
  })
})

describe('tenant leases and rows', () => {
  it('groups leases into current, upcoming and past', () => {
    const saimaa = groupTenantLeases('tenant-saimaa-design', seed.leases, seed.spaces, seed.properties, today)
    expect(saimaa.current.map((entry) => entry.space?.name)).toEqual(['A 305', 'A 304'])
    expect(saimaa.past.map((entry) => entry.space?.name)).toEqual(['A 201'])
    expect(saimaa.past[0]?.property?.name).toBe('Joensuu Center')

    const aurora = groupTenantLeases('tenant-aurora-yoga', seed.leases, seed.spaces, seed.properties, today)
    expect(aurora.current).toEqual([])
    expect(aurora.upcoming.map((entry) => entry.space?.name)).toEqual(['A 302'])
  })

  it('sorts rows by name and filters by type and search', () => {
    const rows = buildTenantRows(seed.tenants, seed.leases, seed.spaces, seed.properties, today, 'fi-FI')
    expect(rows).toHaveLength(31)
    expect(rows[0]?.tenant.name).toBe('Aino Esimerkki')
    expect(rows.find((row) => row.tenant.id === 'tenant-aurora-yoga')?.nextUpcoming?.space?.name).toBe(
      'A 302',
    )

    const filter = (type: '' | 'company' | 'person', query: string) =>
      filterTenantRows(rows, { type, query }, 'fi-FI').map((row) => row.tenant.id)
    expect(filter('company', '')).toHaveLength(16)
    expect(filter('person', '')).toHaveLength(15)
    // Search matches the contact person and the email as well as the name.
    expect(filter('', 'aleksi esimerkki')).toEqual(['tenant-nordic-pixel'])
    expect(filter('', 'info@jarvi-coffee')).toEqual(['tenant-jarvi-coffee'])
    expect(filter('person', 'nordic')).toEqual([])
  })
})

describe('deleting tenants', () => {
  it('is blocked while any lease, even a past one, refers to the tenant', () => {
    expect(checkTenantDeletion('tenant-old-town-books', seed.leases)).toEqual({
      allowed: false,
      leaseCount: 1,
    })
    expect(checkTenantDeletion('tenant-new', seed.leases)).toEqual({ allowed: true, leaseCount: 0 })
  })
})

describe('removing tenants from spaces', () => {
  const lease = (startDate: string, endDate: string | null): Lease => ({
    id: 'lease',
    tenantId: 'tenant',
    spaceId: 'space',
    startDate,
    endDate,
    monthlyRentCents: null,
    createdAt: now,
    updatedAt: now,
  })

  it('ends a running lease yesterday', () => {
    expect(planRemoval(lease('2026-01-01', null), today)).toEqual({ action: 'end', endDate: '2026-09-21' })
    expect(planRemoval(lease('2026-01-01', '2027-01-01'), today)).toEqual({
      action: 'end',
      endDate: '2026-09-21',
    })
  })

  it('cancels a lease that starts today or later', () => {
    expect(planRemoval(lease('2026-09-22', null), today)).toEqual({ action: 'cancel' })
    expect(planRemoval(lease('2026-11-06', null), today)).toEqual({ action: 'cancel' })
  })

  it('leaves ended leases alone', () => {
    expect(planRemoval(lease('2025-01-01', '2026-01-01'), today)).toEqual({ action: 'none' })
  })
})
