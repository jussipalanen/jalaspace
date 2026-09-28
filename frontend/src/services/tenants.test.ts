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
  name: 'Bakery Esimerkki Oy',
  contactPerson: 'Liisa Esimerkki',
  email: 'hello@bakery-esimerkki.example',
  phone: '+358 50 123 4567',
}
const validate = (values: TenantFormValues, editingId?: string) =>
  validateTenantForm(values, seed.tenants, editingId)

describe('validating the tenant form', () => {
  it('accepts valid values and an empty phone', () => {
    expect(validate(valid)).toEqual({})
    expect(validate({ ...valid, phone: '' })).toEqual({})
    expect(validate({ ...valid, phone: '(050) 123-4567' })).toEqual({})
  })

  it('requires a name and a valid email', () => {
    expect(validate({ ...valid, name: '  ', email: '' })).toEqual({ name: 'required', email: 'required' })
    expect(validate({ ...valid, email: 'not-an-email' })).toEqual({ email: 'invalid' })
    expect(validate({ ...valid, name: 'x'.repeat(TENANT_NAME_MAX_LENGTH + 1) })).toEqual({
      name: 'tooLong',
    })
  })

  it('keeps emails unique, ignoring case, except for the tenant being edited', () => {
    expect(validate({ ...valid, email: ' INFO@software-esimerkki.example ' })).toEqual({ email: 'duplicate' })
    expect(validate({ ...valid, email: 'info@software-esimerkki.example' }, 'tenant-software-esimerkki')).toEqual({})
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
      { ...valid, name: ' Bakery Esimerkki Oy ', phone: ' ', contactPerson: '', notes: ' Bakery ' },
      now,
    )
    expect(tenant).toMatchObject({
      name: 'Bakery Esimerkki Oy',
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
    expect(applyTenantChanges(tenant, { ...valid, name: 'Renamed Esimerkki Oy' }, later)).toMatchObject({
      id: tenant.id,
      name: 'Renamed Esimerkki Oy',
      createdAt: now,
      updatedAt: later,
    })
  })
})

describe('tenant leases and rows', () => {
  it('groups leases into current, upcoming and past', () => {
    const designStudio = groupTenantLeases('tenant-design-studio-esimerkki', seed.leases, seed.spaces, seed.properties, today)
    expect(designStudio.current.map((entry) => entry.space?.name)).toEqual(['A 305', 'A 304'])
    expect(designStudio.past.map((entry) => entry.space?.name)).toEqual(['A 201'])
    expect(designStudio.past[0]?.property?.name).toBe('Joensuu Center')

    const yogaStudio = groupTenantLeases('tenant-yoga-studio-esimerkki', seed.leases, seed.spaces, seed.properties, today)
    expect(yogaStudio.current).toEqual([])
    expect(yogaStudio.upcoming.map((entry) => entry.space?.name)).toEqual(['A 302'])
  })

  it('sorts rows by name and filters by type and search', () => {
    const rows = buildTenantRows(seed.tenants, seed.leases, seed.spaces, seed.properties, today, 'fi-FI')
    expect(rows).toHaveLength(31)
    expect(rows.slice(0, 2).map((row) => row.tenant.name)).toEqual(['Accounting Esimerkki Oy', 'Aino Esimerkki'])
    expect(rows.find((row) => row.tenant.id === 'tenant-yoga-studio-esimerkki')?.nextUpcoming?.space?.name).toBe(
      'A 302',
    )

    const filter = (type: '' | 'company' | 'person', query: string) =>
      filterTenantRows(rows, { type, query }, 'fi-FI').map((row) => row.tenant.id)
    expect(filter('company', '')).toHaveLength(16)
    expect(filter('person', '')).toHaveLength(15)
    // Search matches the contact person and the email as well as the name.
    expect(filter('', 'aleksi esimerkki')).toEqual(['tenant-software-esimerkki'])
    expect(filter('', 'info@cafe-esimerkki')).toEqual(['tenant-cafe-esimerkki'])
    expect(filter('person', 'software')).toEqual([])
  })
})

describe('deleting tenants', () => {
  it('is blocked while any lease, even a past one, or an approved application refers to the tenant', () => {
    expect(checkTenantDeletion('tenant-bookshop-esimerkki', seed.leases, seed.applications)).toEqual({
      allowed: false,
      leaseCount: 1,
      applicationCount: 0,
    })
    expect(checkTenantDeletion('tenant-new', [], [{ tenantId: 'tenant-new' }])).toEqual({
      allowed: false,
      leaseCount: 0,
      applicationCount: 1,
    })
    expect(checkTenantDeletion('tenant-new', seed.leases, seed.applications)).toEqual({
      allowed: true,
      leaseCount: 0,
      applicationCount: 0,
    })
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
