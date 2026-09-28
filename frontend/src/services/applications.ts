import type { Application, ApplicationStatus } from '../types/application'
import type { IsoDate, IsoDateTime } from '../types/common'
import type { Lease } from '../types/lease'
import type { Property } from '../types/property'
import type { Space } from '../types/space'
import type { TenantType } from '../types/tenant'
import { isIsoDate } from '../utils/date'
import { getLeaseStatus } from './leases'
import {
  EMAIL_PATTERN,
  isTenantType,
  PHONE_PATTERN,
  TENANT_CONTACT_MAX_LENGTH,
  TENANT_EMAIL_MAX_LENGTH,
  TENANT_NAME_MAX_LENGTH,
  TENANT_PHONE_MAX_LENGTH,
  TENANT_PHONE_MIN_LENGTH,
} from './tenants'

// The rules match the API (backend/src/domain/applications.ts). The applicant's
// details follow the tenant rules, except that the email does not have to be
// unique: one person may apply for several spaces.

export const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  'submitted',
  'in_review',
  'approved',
  'rejected',
  'withdrawn',
]

export const APPLICATION_MESSAGE_MAX_LENGTH = 2000

/** The status changes allowed from each status; `approved`, `rejected` and `withdrawn` are final. */
export const APPLICATION_STATUS_CHANGES: Readonly<Record<ApplicationStatus, readonly ApplicationStatus[]>> = {
  submitted: ['in_review', 'approved', 'rejected', 'withdrawn'],
  in_review: ['approved', 'rejected', 'withdrawn'],
  approved: [],
  rejected: [],
  withdrawn: [],
}

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value)
}

/** Submitted and in review applications still wait for a decision. */
export function isOpenApplication(application: Pick<Application, 'status'>): boolean {
  return application.status === 'submitted' || application.status === 'in_review'
}

/** True when the status may change from `from` to `to`. */
export function canChangeApplicationStatus(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return APPLICATION_STATUS_CHANGES[from].includes(to)
}

/** The application with a new status; `decidedAt` is set when it reaches a final status. */
export function applyApplicationStatus(
  application: Application,
  status: ApplicationStatus,
  now: IsoDateTime,
): Application {
  return {
    ...application,
    status,
    decidedAt: isOpenApplication({ status }) ? null : (application.decidedAt ?? now),
    updatedAt: now,
  }
}

/**
 * A space can be applied for while it is available and not reserved, i.e. no
 * upcoming lease is waiting for it (the Dashboard's "Available spaces").
 */
export function isSpaceOpenForApplications(
  space: Pick<Space, 'id' | 'status'>,
  leases: Lease[],
  today: IsoDate,
): boolean {
  return (
    space.status === 'available' &&
    !leases.some((lease) => lease.spaceId === space.id && getLeaseStatus(lease, today) === 'upcoming')
  )
}

export interface ApplicationFormValues {
  applicantType: TenantType
  name: string
  /** Only used for companies. */
  contactPerson: string
  email: string
  phone: string
  desiredStartDate: string
  message: string
}

/** Error codes per field; the UI translates them. */
export interface ApplicationFormErrors {
  applicantType?: 'invalid'
  name?: 'required' | 'tooLong'
  contactPerson?: 'tooLong'
  email?: 'required' | 'invalid' | 'tooLong'
  phone?: 'invalid'
  desiredStartDate?: 'required' | 'invalid'
  message?: 'tooLong'
}

export function toApplicationForm(application: Application): ApplicationFormValues {
  return {
    applicantType: application.applicantType,
    name: application.name,
    contactPerson: application.contactPerson ?? '',
    email: application.email,
    phone: application.phone ?? '',
    desiredStartDate: application.desiredStartDate,
    message: application.message,
  }
}

export function validateApplicationForm(values: ApplicationFormValues): ApplicationFormErrors {
  const errors: ApplicationFormErrors = {}
  const name = values.name.trim()
  const email = values.email.trim()
  const phone = values.phone.trim()
  const desiredStartDate = values.desiredStartDate.trim()

  if (!isTenantType(values.applicantType)) errors.applicantType = 'invalid'

  if (!name) errors.name = 'required'
  else if (name.length > TENANT_NAME_MAX_LENGTH) errors.name = 'tooLong'

  if (values.applicantType === 'company' && values.contactPerson.trim().length > TENANT_CONTACT_MAX_LENGTH) {
    errors.contactPerson = 'tooLong'
  }

  if (!email) errors.email = 'required'
  else if (email.length > TENANT_EMAIL_MAX_LENGTH) errors.email = 'tooLong'
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'invalid'

  if (
    phone &&
    (!PHONE_PATTERN.test(phone) ||
      phone.length < TENANT_PHONE_MIN_LENGTH ||
      phone.length > TENANT_PHONE_MAX_LENGTH)
  ) {
    errors.phone = 'invalid'
  }

  if (!desiredStartDate) errors.desiredStartDate = 'required'
  else if (!isIsoDate(desiredStartDate)) errors.desiredStartDate = 'invalid'

  if (values.message.trim().length > APPLICATION_MESSAGE_MAX_LENGTH) errors.message = 'tooLong'

  return errors
}

export interface ApplicationRow {
  application: Application
  space: Space | null
  property: Property | null
}

/** Status filter values: one status, or `open` for submitted and in review applications. */
export type ApplicationStatusFilter = ApplicationStatus | 'open'

export const APPLICATION_STATUS_FILTERS: readonly ApplicationStatusFilter[] = ['open', ...APPLICATION_STATUSES]

export function isApplicationStatusFilter(value: string): value is ApplicationStatusFilter {
  return value === 'open' || isApplicationStatus(value)
}

export interface ApplicationFilters {
  status: ApplicationStatusFilter | ''
  propertyId: string
  query: string
}

/** Joins applications with their spaces and properties, newest first. */
export function buildApplicationRows(
  applications: Application[],
  spaces: Space[],
  properties: Property[],
): ApplicationRow[] {
  const spacesById = new Map(spaces.map((space) => [space.id, space]))
  const propertiesById = new Map(properties.map((property) => [property.id, property]))
  return applications
    .map((application) => {
      const space = spacesById.get(application.spaceId) ?? null
      return { application, space, property: space ? (propertiesById.get(space.propertyId) ?? null) : null }
    })
    .toSorted((a, b) => b.application.createdAt.localeCompare(a.application.createdAt))
}

/** Filters rows; the search matches the applicant's name, contact person and email. */
export function filterApplicationRows(
  rows: ApplicationRow[],
  filters: ApplicationFilters,
  locale: string,
): ApplicationRow[] {
  const query = filters.query.trim().toLocaleLowerCase(locale)
  return rows.filter(({ application, space }) => {
    if (filters.status === 'open' && !isOpenApplication(application)) return false
    if (filters.status && filters.status !== 'open' && application.status !== filters.status) return false
    if (filters.propertyId && space?.propertyId !== filters.propertyId) return false
    return (
      !query ||
      [application.name, application.contactPerson ?? '', application.email].some((text) =>
        text.toLocaleLowerCase(locale).includes(query),
      )
    )
  })
}
