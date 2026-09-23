import { describe, expect, it } from 'vitest'
import {
  checkSpaceDeletion,
  checkSpaceReferences,
  parseSpaceInput,
  resolveSpaceStatus,
  type SpaceInput,
} from './spaces.ts'

const valid: SpaceInput = {
  propertyId: 'property-1',
  name: 'A 101',
  type: 'office',
  floor: 1,
  areaM2: 62.5,
  status: 'available',
}

const invalidField = (field: keyof SpaceInput, value: unknown) =>
  parseSpaceInput({ ...valid, [field]: value })

describe('space input', () => {
  it('accepts valid input and trims the text', () => {
    const result = parseSpaceInput({ ...valid, name: '  A 101 ', propertyId: ' property-1' })
    expect(result).toEqual({ ok: true, values: valid })
  })

  it('ignores fields the client may not set', () => {
    const result = parseSpaceInput({ ...valid, id: 'mine', createdAt: 'yesterday', extra: true })
    expect(result).toEqual({ ok: true, values: valid })
  })

  it('reports every missing required field', () => {
    expect(parseSpaceInput({ name: ' ', floor: null, areaM2: '' })).toEqual({
      ok: false,
      errors: {
        propertyId: 'required',
        name: 'required',
        type: 'required',
        floor: 'required',
        areaM2: 'required',
        status: 'required',
      },
    })
  })

  it.each([undefined, null, 'text', 42, ['name']])('treats the body %j as empty', (body) => {
    const result = parseSpaceInput(body)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors.name).toBe('required')
  })

  it('limits the name to 50 characters', () => {
    expect(invalidField('name', 'x'.repeat(50)).ok).toBe(true)
    expect(invalidField('name', 'x'.repeat(51))).toEqual({ ok: false, errors: { name: 'tooLong' } })
  })

  it.each([
    ['name', 42],
    ['propertyId', 7],
    ['type', 'castle'],
    ['status', 'rented'],
  ] as const)('rejects %s %j', (field, value) => {
    expect(invalidField(field, value)).toEqual({ ok: false, errors: { [field]: 'invalid' } })
  })

  it.each([-10, 0, 200])('accepts floor %d', (floor) => {
    expect(invalidField('floor', floor).ok).toBe(true)
  })

  it.each([-11, 201, 1.5, '1', Number.NaN, true])('rejects floor %j', (floor) => {
    expect(invalidField('floor', floor)).toEqual({ ok: false, errors: { floor: 'invalid' } })
  })

  it.each([0.01, 12.34, 62.5, 100_000])('accepts area %d', (areaM2) => {
    expect(invalidField('areaM2', areaM2).ok).toBe(true)
  })

  it.each([0, -5, 100_000.01, 12.345, '62', Number.POSITIVE_INFINITY])('rejects area %j', (areaM2) => {
    expect(invalidField('areaM2', areaM2)).toEqual({ ok: false, errors: { areaM2: 'invalid' } })
  })
})

describe('space references', () => {
  const others = [
    { id: 'space-1', propertyId: 'property-1', name: 'A 101' },
    { id: 'space-2', propertyId: 'property-2', name: 'B 101' },
  ]
  const data = { propertyExists: true, spaces: others, maintenance: [] }

  it('accepts a new space with a unique name in an existing property', () => {
    expect(checkSpaceReferences({ ...valid, name: 'A 102' }, data)).toEqual({})
  })

  it('requires the property to exist', () => {
    expect(checkSpaceReferences({ ...valid, name: 'A 102' }, { ...data, propertyExists: false })).toEqual({
      propertyId: 'notFound',
    })
  })

  it('keeps names unique within a property, ignoring case', () => {
    expect(checkSpaceReferences({ ...valid, name: 'a 101' }, data)).toEqual({ name: 'duplicate' })
    // Another property may use the same name.
    expect(checkSpaceReferences({ ...valid, name: 'B 101' }, data)).toEqual({})
  })

  it('lets a space keep its own name', () => {
    expect(checkSpaceReferences(valid, { ...data, existing: others[0] })).toEqual({})
  })

  it('does not move a space with maintenance tasks to another property', () => {
    const existing = { id: 'space-1', propertyId: 'property-1' }
    const maintenance = [{ spaceId: 'space-1' }]
    const moved = { ...valid, propertyId: 'property-2', name: 'B 102' }

    expect(checkSpaceReferences(moved, { ...data, existing, maintenance })).toEqual({
      propertyId: 'maintenanceLinked',
    })
    expect(checkSpaceReferences(moved, { ...data, existing, maintenance: [{ spaceId: null }] })).toEqual({})
    expect(checkSpaceReferences(valid, { ...data, existing, maintenance })).toEqual({})
  })
})

describe('space status', () => {
  it('is occupied exactly when the space has an active lease', () => {
    expect(resolveSpaceStatus('available', true)).toBe('occupied')
    expect(resolveSpaceStatus('maintenance', true)).toBe('occupied')
    expect(resolveSpaceStatus('occupied', false)).toBe('available')
    expect(resolveSpaceStatus('maintenance', false)).toBe('maintenance')
  })
})

describe('space deletion', () => {
  it('is allowed only when no lease or maintenance task refers to the space', () => {
    const leases = [{ spaceId: 'space-1' }, { spaceId: 'space-1' }, { spaceId: 'space-2' }]
    const maintenance = [{ spaceId: 'space-1' }, { spaceId: null }]

    expect(checkSpaceDeletion('space-1', leases, maintenance)).toEqual({
      allowed: false,
      leaseCount: 2,
      maintenanceCount: 1,
    })
    expect(checkSpaceDeletion('space-3', leases, maintenance)).toEqual({
      allowed: true,
      leaseCount: 0,
      maintenanceCount: 0,
    })
  })
})
