import { describe, expect, it } from 'vitest'
import { createSeedData } from '../data/seed'
import type { MaintenanceTask } from '../types/maintenance'
import {
  applyMaintenanceStatus,
  buildMaintenanceRows,
  buildMaintenanceTask,
  emptyMaintenanceForm,
  filterMaintenanceRows,
  isMaintenanceOverdue,
  MAINTENANCE_DESCRIPTION_MAX_LENGTH,
  MAINTENANCE_TITLE_MAX_LENGTH,
  parseDueDate,
  resolveCompletedAt,
  toMaintenanceForm,
  validateMaintenanceForm,
  type MaintenanceFilters,
  type MaintenanceFormValues,
} from './maintenance'

const now = '2026-09-22T10:30:00.000Z'
const later = '2026-09-25T08:00:00.000Z'
const seed = createSeedData(new Date(now))
const valid: MaintenanceFormValues = {
  ...emptyMaintenanceForm('property-joensuu-center'),
  spaceId: 'space-joensuu-center-1',
  title: 'Broken window',
  dueDate: '30.9.2026',
}
const validate = (values: MaintenanceFormValues) =>
  validateMaintenanceForm(values, seed.properties, seed.spaces)

describe('parsing due dates', () => {
  it.each([
    ['30.9.2026', '2026-09-30'],
    [' 1.1.2027 ', '2027-01-01'],
    ['05.03.2026', '2026-03-05'],
    ['29.2.2028', '2028-02-29'],
    ['1.1.2020', '2020-01-01'],
  ])('parses "%s" as a date-only ISO string', (input, expected) => {
    expect(parseDueDate(input)).toBe(expected)
  })

  it.each(['31.2.2026', '29.2.2027', '31.4.2026', '0.1.2026', '1.13.2026', '2026-09-30', '30.9.', 'soon'])(
    'rejects "%s"',
    (input) => {
      expect(parseDueDate(input)).toBeNull()
    },
  )
})

describe('validating the maintenance form', () => {
  it('accepts valid values, a past due date and no space', () => {
    expect(validate(valid)).toEqual({})
    expect(validate({ ...valid, dueDate: '1.1.2020' })).toEqual({})
    expect(validate({ ...valid, spaceId: '', dueDate: '' })).toEqual({})
  })

  it('requires an existing property and a trimmed title', () => {
    expect(validate({ ...valid, propertyId: '', spaceId: '', title: '   ' })).toEqual({
      propertyId: 'required',
      title: 'required',
    })
    expect(validate({ ...valid, propertyId: 'deleted-property', spaceId: '' })).toEqual({
      propertyId: 'notFound',
    })
  })

  it('rejects a space of another property or a deleted space', () => {
    expect(validate({ ...valid, spaceId: 'space-kuopio-harbour-1' })).toEqual({ spaceId: 'invalid' })
    expect(validate({ ...valid, spaceId: 'deleted-space' })).toEqual({ spaceId: 'invalid' })
  })

  it('limits the title and description length', () => {
    expect(validate({ ...valid, title: 'x'.repeat(MAINTENANCE_TITLE_MAX_LENGTH) })).toEqual({})
    expect(
      validate({
        ...valid,
        title: 'x'.repeat(MAINTENANCE_TITLE_MAX_LENGTH + 1),
        description: 'x'.repeat(MAINTENANCE_DESCRIPTION_MAX_LENGTH + 1),
      }),
    ).toEqual({ title: 'tooLong', description: 'tooLong' })
  })

  it('rejects invalid dates and values outside the domain unions', () => {
    const tampered = { ...valid, category: 'gardening', priority: 'urgent', status: 'done' }
    expect(validate({ ...(tampered as unknown as MaintenanceFormValues), dueDate: '31.2.2026' })).toEqual({
      category: 'invalid',
      priority: 'invalid',
      status: 'invalid',
      dueDate: 'invalid',
    })
  })
})

describe('building tasks', () => {
  it('trims values and stores the due date without a time', () => {
    const task = buildMaintenanceTask({ ...valid, title: ' Broken window ', description: ' Glass ' }, now)
    expect(task).toMatchObject({
      propertyId: 'property-joensuu-center',
      spaceId: 'space-joensuu-center-1',
      title: 'Broken window',
      description: 'Glass',
      dueDate: '2026-09-30',
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    expect(buildMaintenanceTask({ ...valid, spaceId: '', dueDate: '' }, now)).toMatchObject({
      spaceId: null,
      dueDate: null,
    })
  })

  it('round-trips a task through the form', () => {
    const task = buildMaintenanceTask(valid, now)
    expect(toMaintenanceForm(task)).toEqual(valid)
  })

  it('sets the completion time when created as completed', () => {
    expect(buildMaintenanceTask({ ...valid, status: 'completed' }, now).completedAt).toBe(now)
  })

  it('keeps the identity, creation and completion time on edits', () => {
    const completed = buildMaintenanceTask({ ...valid, status: 'completed' }, now)
    const edited = buildMaintenanceTask({ ...valid, status: 'completed', title: 'Renamed' }, later, completed)
    expect(edited).toMatchObject({
      id: completed.id,
      title: 'Renamed',
      createdAt: now,
      updatedAt: later,
      completedAt: now,
    })
  })
})

describe('changing the status', () => {
  const open = buildMaintenanceTask(valid, now)

  it('completes, reopens and completes again with a new time', () => {
    const completed = applyMaintenanceStatus(open, 'completed', now)
    expect(completed).toMatchObject({ status: 'completed', completedAt: now })

    const reopened = applyMaintenanceStatus(completed, 'open', later)
    expect(reopened).toMatchObject({ status: 'open', completedAt: null, updatedAt: later })

    expect(applyMaintenanceStatus(reopened, 'completed', later).completedAt).toBe(later)
  })

  it('keeps every other field', () => {
    const started = applyMaintenanceStatus(open, 'in_progress', later)
    expect(started).toEqual({ ...open, status: 'in_progress', updatedAt: later })
  })

  it('keeps the completion time while the task stays completed', () => {
    const completed = applyMaintenanceStatus(open, 'completed', now)
    expect(resolveCompletedAt('completed', completed, later)).toBe(now)
    expect(resolveCompletedAt('in_progress', completed, later)).toBeNull()
  })
})

describe('overdue tasks', () => {
  const task = (overrides: Partial<MaintenanceTask>): MaintenanceTask => ({
    ...buildMaintenanceTask(valid, now),
    ...overrides,
  })

  it('are open or in progress with a due date before today', () => {
    expect(isMaintenanceOverdue(task({ dueDate: '2026-09-21' }), '2026-09-22')).toBe(true)
    expect(isMaintenanceOverdue(task({ dueDate: '2026-09-22' }), '2026-09-22')).toBe(false)
    expect(isMaintenanceOverdue(task({ dueDate: null }), '2026-09-22')).toBe(false)
    expect(
      isMaintenanceOverdue(task({ dueDate: '2026-09-21', status: 'completed' }), '2026-09-22'),
    ).toBe(false)
  })
})

describe('listing tasks', () => {
  const rows = buildMaintenanceRows(seed.maintenance, seed.properties, seed.spaces, 'en-GB')
  const none: MaintenanceFilters = {
    propertyId: '',
    spaceId: '',
    priority: '',
    status: '',
    dueBy: '',
    overdueOnly: false,
    query: '',
  }
  const filter = (filters: Partial<MaintenanceFilters>, today = '2026-09-22') =>
    filterMaintenanceRows(rows, { ...none, ...filters }, 'en-GB', today).map((row) => row.task.id)

  it('joins the property and space, newest first', () => {
    expect(rows).toHaveLength(seed.maintenance.length)
    const created = rows.map((row) => row.task.createdAt)
    expect(created).toEqual(created.toSorted().reverse())

    const doorCloser = rows.find((row) => row.task.id === 'maintenance-3')!
    expect(doorCloser.property?.name).toBe('Joensuu Center')
    expect(doorCloser.space).toBeNull()
    expect(rows.find((row) => row.task.id === 'maintenance-2')?.space?.name).toBe('Retail 1')
  })

  it('filters by property, space, priority and status', () => {
    expect(filter({ propertyId: 'property-joensuu-center' })).toHaveLength(4)
    expect(filter({ spaceId: 'space-joensuu-center-1' })).toEqual(['maintenance-2'])
    expect(filter({ propertyId: 'property-joensuu-center', priority: 'high', status: 'open' })).toEqual([
      'maintenance-3',
    ])
  })

  it('shows tasks due on or before a date, leaving out tasks without a due date', () => {
    // Seed due dates are relative to 22.9.2026; 25.9. includes tasks due in up to 3 days.
    expect(filter({ dueBy: '2026-09-25' }).toSorted()).toEqual([
      'maintenance-14',
      'maintenance-3',
      'maintenance-4',
      'maintenance-6',
      'maintenance-7',
      'maintenance-8',
      'maintenance-9',
    ])
    expect(filter({ dueBy: '2026-09-25', status: 'open' })).toEqual(['maintenance-3'])
    expect(filter({ dueBy: '2000-01-01' })).toEqual([])
  })

  it('shows only overdue tasks when asked', () => {
    // In the seed data every task with a past due date is completed.
    expect(filter({ overdueOnly: true })).toEqual([])
    // Three days later, the door closer (due in 2 days) is overdue; the
    // in-progress loading dock task (due in 1 day) is too.
    expect(filter({ overdueOnly: true }, '2026-09-25').toSorted()).toEqual([
      'maintenance-3',
      'maintenance-8',
    ])
  })

  it('searches titles and descriptions, ignoring case', () => {
    expect(filter({ query: 'GREASE' })).toEqual(['maintenance-2'])
    expect(filter({ query: 'roof membrane' })).toEqual(['maintenance-1'])
    expect(filter({ query: 'no such task' })).toEqual([])
  })
})
