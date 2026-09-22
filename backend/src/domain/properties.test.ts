import { describe, expect, it } from 'vitest'
import { checkPropertyDeletion, parsePropertyInput } from './properties.ts'

const valid = {
  name: 'Joensuu Center',
  type: 'mixed_use',
  address: 'Siltakatu 12',
  postalCode: '80100',
  city: 'Joensuu',
  description: 'City-centre building.',
}

describe('property input', () => {
  it('accepts valid input and trims the text', () => {
    const result = parsePropertyInput({ ...valid, name: '  Joensuu Center ', city: ' Joensuu' })
    expect(result).toEqual({ ok: true, values: valid })
  })

  it('treats a missing description as empty', () => {
    const { description: _description, ...withoutDescription } = valid
    expect(parsePropertyInput(withoutDescription)).toEqual({ ok: true, values: { ...valid, description: '' } })
  })

  it('ignores fields the client may not set', () => {
    const result = parsePropertyInput({ ...valid, id: 'mine', createdAt: 'yesterday', extra: true })
    expect(result).toEqual({ ok: true, values: valid })
  })

  it('reports every missing required field', () => {
    expect(parsePropertyInput({ name: ' ', address: '', description: '' })).toEqual({
      ok: false,
      errors: {
        name: 'required',
        type: 'required',
        address: 'required',
        postalCode: 'required',
        city: 'required',
      },
    })
  })

  it.each([undefined, null, 'text', 42, ['name']])('treats the body %j as empty', (body) => {
    const result = parsePropertyInput(body)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors.name).toBe('required')
  })

  it.each(['8010', '801000', 'ABCDE', '80 100'])('rejects the postal code "%s"', (postalCode) => {
    expect(parsePropertyInput({ ...valid, postalCode })).toEqual({
      ok: false,
      errors: { postalCode: 'invalid' },
    })
  })

  it('limits the name to 100 and the description to 1000 characters', () => {
    expect(parsePropertyInput({ ...valid, name: 'x'.repeat(100), description: 'x'.repeat(1000) }).ok).toBe(true)
    expect(parsePropertyInput({ ...valid, name: 'x'.repeat(101), description: 'x'.repeat(1001) })).toEqual({
      ok: false,
      errors: { name: 'tooLong', description: 'tooLong' },
    })
  })

  it('rejects an unknown property type', () => {
    expect(parsePropertyInput({ ...valid, type: 'castle' })).toEqual({ ok: false, errors: { type: 'invalid' } })
  })

  it('rejects values of the wrong JSON type', () => {
    expect(parsePropertyInput({ ...valid, name: 42, city: ['Joensuu'], description: {} })).toEqual({
      ok: false,
      errors: { name: 'invalid', city: 'invalid', description: 'invalid' },
    })
  })
})

describe('property deletion', () => {
  it('is allowed when nothing refers to the property', () => {
    expect(checkPropertyDeletion('a', [{ propertyId: 'b' }], [])).toEqual({
      allowed: true,
      spaceCount: 0,
      maintenanceCount: 0,
    })
  })

  it('is blocked by spaces or maintenance tasks, with the counts', () => {
    const spaces = [{ propertyId: 'a' }, { propertyId: 'a' }, { propertyId: 'b' }]
    expect(checkPropertyDeletion('a', spaces, [{ propertyId: 'a' }])).toEqual({
      allowed: false,
      spaceCount: 2,
      maintenanceCount: 1,
    })
    expect(checkPropertyDeletion('b', [], [{ propertyId: 'b' }]).allowed).toBe(false)
  })
})
