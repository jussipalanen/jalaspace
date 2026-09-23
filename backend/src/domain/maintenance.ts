import {
  isIsoDate,
  isRecord,
  readText,
  type Entity,
  type FieldErrorCode,
  type IsoDate,
  type IsoDateTime,
  type ParseResult,
} from './common.ts'

// The same values and rules as the frontend (frontend/src/services/maintenance.ts),
// so the UI can translate every field error the API returns. Change them together.

export const MAINTENANCE_CATEGORIES = [
  'plumbing',
  'electrical',
  'hvac',
  'structural',
  'cleaning',
  'general',
] as const

export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number]

export const MAINTENANCE_PRIORITIES = ['low', 'medium', 'high'] as const

export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number]

export const MAINTENANCE_STATUSES = ['open', 'in_progress', 'completed'] as const

export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number]

export const MAINTENANCE_TITLE_MAX_LENGTH = 120
export const MAINTENANCE_DESCRIPTION_MAX_LENGTH = 5000

export function isMaintenanceCategory(value: unknown): value is MaintenanceCategory {
  return (MAINTENANCE_CATEGORIES as readonly unknown[]).includes(value)
}

export function isMaintenancePriority(value: unknown): value is MaintenancePriority {
  return (MAINTENANCE_PRIORITIES as readonly unknown[]).includes(value)
}

export function isMaintenanceStatus(value: unknown): value is MaintenanceStatus {
  return (MAINTENANCE_STATUSES as readonly unknown[]).includes(value)
}

/**
 * The fields a client may set; the server sets `id`, `createdAt`, `updatedAt`
 * and `completedAt`.
 */
export interface MaintenanceInput {
  propertyId: string
  /** `null` when the task concerns the whole property or a common area. */
  spaceId: string | null
  title: string
  description: string
  category: MaintenanceCategory
  priority: MaintenancePriority
  status: MaintenanceStatus
  /** Past dates are allowed, e.g. for recording overdue work. */
  dueDate: IsoDate | null
}

export interface MaintenanceTask extends Entity, MaintenanceInput {
  /** Set when the task is completed, otherwise `null`. */
  completedAt: IsoDateTime | null
}

export type MaintenanceFieldErrors = Partial<Record<keyof MaintenanceInput, FieldErrorCode>>

const isMissing = (value: unknown) => value === undefined || value === null || value === ''

/**
 * Checks a request body and returns the trimmed input, or an error code per
 * field. Whether the property and space exist is checked by
 * `checkMaintenanceReferences`.
 */
export function parseMaintenanceInput(body: unknown): ParseResult<MaintenanceInput> {
  const source = isRecord(body) ? body : {}
  const errors: MaintenanceFieldErrors = {}

  const propertyId = readText(source, 'propertyId')
  if (propertyId === undefined) errors.propertyId = 'invalid'
  else if (!propertyId) errors.propertyId = 'required'

  // Missing, null or empty: the task concerns the whole property.
  const spaceId = readText(source, 'spaceId')
  if (spaceId === undefined) errors.spaceId = 'invalid'

  const title = readText(source, 'title')
  if (title === undefined) errors.title = 'invalid'
  else if (!title) errors.title = 'required'
  else if (title.length > MAINTENANCE_TITLE_MAX_LENGTH) errors.title = 'tooLong'

  const description = readText(source, 'description')
  if (description === undefined) errors.description = 'invalid'
  else if (description.length > MAINTENANCE_DESCRIPTION_MAX_LENGTH) errors.description = 'tooLong'

  const { category, priority, status } = source
  if (isMissing(category)) errors.category = 'required'
  else if (!isMaintenanceCategory(category)) errors.category = 'invalid'

  if (isMissing(priority)) errors.priority = 'required'
  else if (!isMaintenancePriority(priority)) errors.priority = 'invalid'

  if (isMissing(status)) errors.status = 'required'
  else if (!isMaintenanceStatus(status)) errors.status = 'invalid'

  const dueDate = readText(source, 'dueDate')
  if (dueDate === undefined || (dueDate && !isIsoDate(dueDate))) errors.dueDate = 'invalid'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    // Every field was checked above; the assertions only narrow the types.
    values: {
      propertyId: propertyId!,
      spaceId: spaceId || null,
      title: title!,
      description: description!,
      category: category as MaintenanceCategory,
      priority: priority as MaintenancePriority,
      status: status as MaintenanceStatus,
      dueDate: dueDate || null,
    },
  }
}

/**
 * Checks the input against the current data: the property must exist, and the
 * space, when given, must belong to it. An empty result means it can be saved.
 */
export function checkMaintenanceReferences(
  input: Pick<MaintenanceInput, 'propertyId' | 'spaceId'>,
  data: { propertyExists: boolean; spaces: readonly { id: string; propertyId: string }[] },
): MaintenanceFieldErrors {
  const errors: MaintenanceFieldErrors = {}
  if (!data.propertyExists) errors.propertyId = 'notFound'
  if (
    input.spaceId !== null &&
    !data.spaces.some((space) => space.id === input.spaceId && space.propertyId === input.propertyId)
  ) {
    errors.spaceId = 'invalid'
  }
  return errors
}

/**
 * Completion time for a task moving to `status`: kept while it stays completed,
 * cleared when it is reopened and set anew when it is completed again.
 */
export function resolveCompletedAt(
  status: MaintenanceStatus,
  existing: Pick<MaintenanceTask, 'status' | 'completedAt'> | null,
  now: IsoDateTime,
): IsoDateTime | null {
  if (status !== 'completed') return null
  if (existing?.status === 'completed' && existing.completedAt) return existing.completedAt
  return now
}
