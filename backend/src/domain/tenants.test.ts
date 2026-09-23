import { describe, expect, it } from 'vitest'
import { checkTenantDeletion, checkTenantEmail, parseTenantInput, type TenantInput } from './tenants.ts'

const company: TenantInput = {
  type: 'company',
  name: 'Nordic Pixel Oy',
  contactPerson: 'Aleksi Rautio',
  email: 'info@nordic-pixel.example',
  phone: '+358 40 123 4567',
  notes: 'Software development company.',
}

const withField = (field: keyof TenantInput, value: unknown) => parseTenantInput({ ...company, [field]: value })

describe('tenant input', () => {
  it('accepts valid input and trims the text', () => {
    const result = parseTenantInput({ ...company, name: '  Nordic Pixel Oy ', email: ' info@nordic-pixel.example ' })
    expect(result).toEqual({ ok: true, values: company })
  })

  it('ignores fields the client may not set', () => {
    const result = parseTenantInput({ ...company, id: 'mine', createdAt: 'yesterday', extra: true })
    expect(result).toEqual({ ok: true, values: company })
  })

  it('stores empty optional fields as null or empty text', () => {
    const result = parseTenantInput({ ...company, contactPerson: ' ', phone: '', notes: undefined })
    expect(result).toEqual({ ok: true, values: { ...company, contactPerson: null, phone: null, notes: '' } })
  })

  it('drops the contact person of a person, whatever it is', () => {
    const person = { ...company, type: 'person', name: 'Aino Virtanen' }
    for (const contactPerson of ['Someone', 'x'.repeat(200), 42]) {
      expect(parseTenantInput({ ...person, contactPerson })).toEqual({
        ok: true,
        values: { ...person, contactPerson: null },
      })
    }
  })

  it('reports every missing required field', () => {
    expect(parseTenantInput({ name: ' ' })).toEqual({
      ok: false,
      errors: { type: 'required', name: 'required', email: 'required' },
    })
  })

  it.each([undefined, null, 'text', 42, ['name']])('treats the body %j as empty', (body) => {
    const result = parseTenantInput(body)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors.name).toBe('required')
  })

  it.each([
    ['name', 100],
    ['contactPerson', 100],
    ['notes', 2000],
  ] as const)('limits %s to %d characters', (field, max) => {
    expect(withField(field, 'x'.repeat(max)).ok).toBe(true)
    expect(withField(field, 'x'.repeat(max + 1))).toEqual({ ok: false, errors: { [field]: 'tooLong' } })
  })

  it('limits the email to 254 characters', () => {
    const email = (length: number) => `${'x'.repeat(length - '@example.com'.length)}@example.com`
    expect(withField('email', email(254)).ok).toBe(true)
    expect(withField('email', email(255))).toEqual({ ok: false, errors: { email: 'tooLong' } })
  })

  it.each(['info', 'info@example', '@example.com', 'info@@example.com', 'in fo@example.com'])(
    'rejects the email "%s"',
    (email) => {
      expect(withField('email', email)).toEqual({ ok: false, errors: { email: 'invalid' } })
    },
  )

  it.each(['12345', '+358 40 123 4567', '(013) 123-456', '0'.repeat(20)])('accepts the phone "%s"', (phone) => {
    expect(withField('phone', phone).ok).toBe(true)
  })

  it.each(['1234', '0'.repeat(21), '040 123 456 x', '040.123.456', 40123456])('rejects the phone %j', (phone) => {
    expect(withField('phone', phone)).toEqual({ ok: false, errors: { phone: 'invalid' } })
  })

  it.each([
    ['type', 'robot'],
    ['name', 42],
    ['contactPerson', 42],
    ['email', 42],
    ['notes', false],
  ] as const)('rejects %s %j', (field, value) => {
    expect(withField(field, value)).toEqual({ ok: false, errors: { [field]: 'invalid' } })
  })
})

describe('tenant email', () => {
  const tenants = [
    { id: 'tenant-1', email: 'info@nordic-pixel.example' },
    { id: 'tenant-2', email: 'aino.virtanen@example.com' },
  ]

  it('must be unique, ignoring case', () => {
    expect(checkTenantEmail('INFO@Nordic-Pixel.example', tenants)).toEqual({ email: 'duplicate' })
    expect(checkTenantEmail('info@lumo-florist.example', tenants)).toEqual({})
  })

  it('may stay the same when the tenant is updated', () => {
    expect(checkTenantEmail('info@nordic-pixel.example', tenants, 'tenant-1')).toEqual({})
    expect(checkTenantEmail('info@nordic-pixel.example', tenants, 'tenant-2')).toEqual({ email: 'duplicate' })
  })
})

describe('tenant deletion', () => {
  it('is allowed only when no lease refers to the tenant', () => {
    const leases = [{ tenantId: 'tenant-1' }, { tenantId: 'tenant-1' }, { tenantId: 'tenant-2' }]
    expect(checkTenantDeletion('tenant-1', leases)).toEqual({ allowed: false, leaseCount: 2 })
    expect(checkTenantDeletion('tenant-3', leases)).toEqual({ allowed: true, leaseCount: 0 })
  })
})
