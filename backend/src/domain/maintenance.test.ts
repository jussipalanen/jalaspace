import { describe, expect, it } from 'vitest'
import {
  checkMaintenanceReferences,
  parseMaintenanceInput,
  resolveCompletedAt,
  type MaintenanceInput,
} from './maintenance.ts'

const valid: MaintenanceInput = {
  propertyId: 'property-1',
  spaceId: 'space-1',
  title: 'Leaking tap',
  description: 'The kitchen tap drips.',
  category: 'plumbing',
  priority: 'medium',
  status: 'open',
  dueDate: '2026-09-30',
}

const withField = (field: keyof MaintenanceInput, value: unknown) =>
  parseMaintenanceInput({ ...valid, [field]: value })

describe('maintenance input', () => {
  it('accepts valid input and trims the text', () => {
    const result = parseMaintenanceInput({ ...valid, title: '  Leaking tap ', spaceId: ' space-1 ' })
    expect(result).toEqual({ ok: true, values: valid })
  })

  it('ignores fields the client may not set', () => {
    const result = parseMaintenanceInput({
      ...valid,
      id: 'mine',
      completedAt: '2026-01-01T00:00:00.000Z',
      createdAt: 'yesterday',
    })
    expect(result).toEqual({ ok: true, values: valid })
  })

  it.each([undefined, null, ''])('treats the space %j as the whole property', (spaceId) => {
    expect(withField('spaceId', spaceId)).toEqual({ ok: true, values: { ...valid, spaceId: null } })
  })

  it.each([undefined, null, ''])('treats the due date %j as none', (dueDate) => {
    expect(withField('dueDate', dueDate)).toEqual({ ok: true, values: { ...valid, dueDate: null } })
  })

  it('treats a missing description as empty', () => {
    const { description: _description, ...withoutDescription } = valid
    expect(parseMaintenanceInput(withoutDescription)).toEqual({ ok: true, values: { ...valid, description: '' } })
  })

  it('allows due dates in the past', () => {
    expect(withField('dueDate', '2020-01-31').ok).toBe(true)
  })

  it('reports every missing required field', () => {
    expect(parseMaintenanceInput({ title: ' ' })).toEqual({
      ok: false,
      errors: {
        propertyId: 'required',
        title: 'required',
        category: 'required',
        priority: 'required',
        status: 'required',
      },
    })
  })

  it.each([undefined, null, 'text', 42, ['title']])('treats the body %j as empty', (body) => {
    const result = parseMaintenanceInput(body)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors.title).toBe('required')
  })

  it('limits the title to 120 and the description to 5000 characters', () => {
    expect(withField('title', 'x'.repeat(120)).ok).toBe(true)
    expect(withField('title', 'x'.repeat(121))).toEqual({ ok: false, errors: { title: 'tooLong' } })
    expect(withField('description', 'x'.repeat(5000)).ok).toBe(true)
    expect(withField('description', 'x'.repeat(5001))).toEqual({ ok: false, errors: { description: 'tooLong' } })
  })

  it.each([
    ['propertyId', 7],
    ['spaceId', 7],
    ['title', 42],
    ['description', false],
    ['category', 'gardening'],
    ['priority', 'urgent'],
    ['status', 'done'],
  ] as const)('rejects %s %j', (field, value) => {
    expect(withField(field, value)).toEqual({ ok: false, errors: { [field]: 'invalid' } })
  })

  it.each(['2026-02-30', '2026-13-01', '30.9.2026', '2026-09-30T00:00:00.000Z', '2026-9-30', 20260930])(
    'rejects the due date %j',
    (dueDate) => {
      expect(withField('dueDate', dueDate)).toEqual({ ok: false, errors: { dueDate: 'invalid' } })
    },
  )

  it('accepts 29 February only in leap years', () => {
    expect(withField('dueDate', '2028-02-29').ok).toBe(true)
    expect(withField('dueDate', '2027-02-29').ok).toBe(false)
  })
})

describe('maintenance references', () => {
  const spaces = [
    { id: 'space-1', propertyId: 'property-1' },
    { id: 'space-2', propertyId: 'property-2' },
  ]

  it('accepts a space of the task property, or no space', () => {
    expect(checkMaintenanceReferences(valid, { propertyExists: true, spaces })).toEqual({})
    expect(checkMaintenanceReferences({ ...valid, spaceId: null }, { propertyExists: true, spaces })).toEqual({})
  })

  it('requires the property to exist', () => {
    expect(checkMaintenanceReferences({ ...valid, spaceId: null }, { propertyExists: false, spaces })).toEqual({
      propertyId: 'notFound',
    })
  })

  it('rejects a space of another property or one that does not exist', () => {
    for (const spaceId of ['space-2', 'missing']) {
      expect(checkMaintenanceReferences({ ...valid, spaceId }, { propertyExists: true, spaces })).toEqual({
        spaceId: 'invalid',
      })
    }
  })
})

describe('completion time', () => {
  const now = '2026-09-23T10:00:00.000Z'
  const earlier = '2026-09-01T08:00:00.000Z'

  it('is set when a task is completed', () => {
    expect(resolveCompletedAt('completed', null, now)).toBe(now)
    expect(resolveCompletedAt('completed', { status: 'in_progress', completedAt: null }, now)).toBe(now)
  })

  it('is kept while the task stays completed', () => {
    expect(resolveCompletedAt('completed', { status: 'completed', completedAt: earlier }, now)).toBe(earlier)
  })

  it('is cleared when the task is reopened', () => {
    expect(resolveCompletedAt('open', { status: 'completed', completedAt: earlier }, now)).toBeNull()
    expect(resolveCompletedAt('in_progress', null, now)).toBeNull()
  })
})
