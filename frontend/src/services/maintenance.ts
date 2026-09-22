import type { IsoDate, IsoDateTime } from '../types/common'
import type {
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceTask,
} from '../types/maintenance'
import type { Property } from '../types/property'
import type { Space } from '../types/space'
import { formatDate } from '../utils/format'
import { parseDisplayDate } from '../utils/date'
import { generateId } from '../utils/id'

export const MAINTENANCE_CATEGORIES: readonly MaintenanceCategory[] = [
  'plumbing',
  'electrical',
  'hvac',
  'structural',
  'cleaning',
  'general',
]
export const MAINTENANCE_PRIORITIES: readonly MaintenancePriority[] = ['low', 'medium', 'high']
export const MAINTENANCE_STATUSES: readonly MaintenanceStatus[] = ['open', 'in_progress', 'completed']

export const MAINTENANCE_TITLE_MAX_LENGTH = 120
export const MAINTENANCE_DESCRIPTION_MAX_LENGTH = 5000

export function isMaintenanceStatus(value: string): value is MaintenanceStatus {
  return (MAINTENANCE_STATUSES as readonly string[]).includes(value)
}

export function isMaintenancePriority(value: string): value is MaintenancePriority {
  return (MAINTENANCE_PRIORITIES as readonly string[]).includes(value)
}

export function isMaintenanceCategory(value: string): value is MaintenanceCategory {
  return (MAINTENANCE_CATEGORIES as readonly string[]).includes(value)
}

/** Form values; the due date is the raw `d.m.yyyy` text the user typed. */
export interface MaintenanceFormValues {
  propertyId: string
  /** Empty when the task concerns the whole property or a common area. */
  spaceId: string
  title: string
  description: string
  category: MaintenanceCategory
  priority: MaintenancePriority
  status: MaintenanceStatus
  dueDate: string
}

/** Error codes per field; the UI translates them (`maintenance.form.validation.<field>.<code>`). */
export interface MaintenanceFormErrors {
  propertyId?: 'required' | 'notFound'
  spaceId?: 'invalid'
  title?: 'required' | 'tooLong'
  description?: 'tooLong'
  category?: 'invalid'
  priority?: 'invalid'
  status?: 'invalid'
  dueDate?: 'invalid'
}

export function emptyMaintenanceForm(propertyId = ''): MaintenanceFormValues {
  return {
    propertyId,
    spaceId: '',
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    status: 'open',
    dueDate: '',
  }
}

export function toMaintenanceForm(task: MaintenanceTask): MaintenanceFormValues {
  return {
    propertyId: task.propertyId,
    spaceId: task.spaceId ?? '',
    title: task.title,
    description: task.description,
    category: task.category,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ? formatDate(task.dueDate) : '',
  }
}

/** Parses a `d.m.yyyy` due date into a date-only ISO string, or `null` if it is not a real date. */
export function parseDueDate(value: string): IsoDate | null {
  return parseDisplayDate(value)
}

/**
 * Validates the form. The optional space must belong to the chosen property.
 * Due dates in the past are allowed, e.g. for recording overdue work.
 */
export function validateMaintenanceForm(
  values: MaintenanceFormValues,
  properties: Pick<Property, 'id'>[],
  spaces: Pick<Space, 'id' | 'propertyId'>[],
): MaintenanceFormErrors {
  const errors: MaintenanceFormErrors = {}
  const title = values.title.trim()

  if (!values.propertyId) errors.propertyId = 'required'
  else if (!properties.some((property) => property.id === values.propertyId)) {
    errors.propertyId = 'notFound'
  }

  if (
    values.spaceId &&
    !spaces.some((space) => space.id === values.spaceId && space.propertyId === values.propertyId)
  ) {
    errors.spaceId = 'invalid'
  }

  if (!title) errors.title = 'required'
  else if (title.length > MAINTENANCE_TITLE_MAX_LENGTH) errors.title = 'tooLong'

  if (values.description.trim().length > MAINTENANCE_DESCRIPTION_MAX_LENGTH) {
    errors.description = 'tooLong'
  }

  if (!isMaintenanceCategory(values.category)) errors.category = 'invalid'
  if (!isMaintenancePriority(values.priority)) errors.priority = 'invalid'
  if (!isMaintenanceStatus(values.status)) errors.status = 'invalid'
  if (values.dueDate.trim() && !parseDueDate(values.dueDate)) errors.dueDate = 'invalid'

  return errors
}

/**
 * Completion time for a task moving to `status`: kept while it stays completed,
 * cleared when it is reopened and set anew when it is completed again.
 */
export function resolveCompletedAt(
  status: MaintenanceStatus,
  existing: MaintenanceTask | null,
  now: IsoDateTime,
): IsoDateTime | null {
  if (status !== 'completed') return null
  if (existing?.status === 'completed' && existing.completedAt) return existing.completedAt
  return now
}

/** Builds a task from validated values, keeping the identity and creation time of `existing`. */
export function buildMaintenanceTask(
  values: MaintenanceFormValues,
  now: IsoDateTime,
  existing: MaintenanceTask | null = null,
): MaintenanceTask {
  return {
    id: existing?.id ?? generateId(),
    propertyId: values.propertyId,
    spaceId: values.spaceId || null,
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    priority: values.priority,
    status: values.status,
    dueDate: parseDueDate(values.dueDate),
    completedAt: resolveCompletedAt(values.status, existing, now),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

/** Applies a status change, keeping every other field of the task as it is. */
export function applyMaintenanceStatus(
  task: MaintenanceTask,
  status: MaintenanceStatus,
  now: IsoDateTime,
): MaintenanceTask {
  return { ...task, status, completedAt: resolveCompletedAt(status, task, now), updatedAt: now }
}

/** A task is overdue when its due date has passed and it is not completed. */
export function isMaintenanceOverdue(task: MaintenanceTask, today: IsoDate): boolean {
  return task.status !== 'completed' && task.dueDate !== null && task.dueDate < today
}

export interface MaintenanceRow {
  task: MaintenanceTask
  property: Property | null
  space: Space | null
}

export interface MaintenanceFilters {
  propertyId: string
  spaceId: string
  priority: MaintenancePriority | ''
  status: MaintenanceStatus | ''
  /** Only tasks due on or before this date; tasks without a due date are left out. */
  dueBy: IsoDate | ''
  /** Only tasks that are past their due date and not completed. */
  overdueOnly: boolean
  query: string
}

/** Joins tasks with their property and space, newest first. */
export function buildMaintenanceRows(
  tasks: MaintenanceTask[],
  properties: Property[],
  spaces: Space[],
  locale: string,
): MaintenanceRow[] {
  const propertiesById = new Map(properties.map((property) => [property.id, property]))
  const spacesById = new Map(spaces.map((space) => [space.id, space]))
  const collator = new Intl.Collator(locale, { numeric: true })

  return tasks
    .map((task) => ({
      task,
      property: propertiesById.get(task.propertyId) ?? null,
      space: task.spaceId ? (spacesById.get(task.spaceId) ?? null) : null,
    }))
    .toSorted(
      (a, b) =>
        b.task.createdAt.localeCompare(a.task.createdAt) ||
        collator.compare(a.task.title, b.task.title),
    )
}

/** Filters rows; the search matches the title and description. */
export function filterMaintenanceRows(
  rows: MaintenanceRow[],
  filters: MaintenanceFilters,
  locale: string,
  today: IsoDate,
): MaintenanceRow[] {
  const query = filters.query.trim().toLocaleLowerCase(locale)
  return rows.filter(
    ({ task }) =>
      (!filters.propertyId || task.propertyId === filters.propertyId) &&
      (!filters.spaceId || task.spaceId === filters.spaceId) &&
      (!filters.priority || task.priority === filters.priority) &&
      (!filters.status || task.status === filters.status) &&
      (!filters.dueBy || (task.dueDate !== null && task.dueDate <= filters.dueBy)) &&
      (!filters.overdueOnly || isMaintenanceOverdue(task, today)) &&
      (!query ||
        task.title.toLocaleLowerCase(locale).includes(query) ||
        task.description.toLocaleLowerCase(locale).includes(query)),
  )
}
