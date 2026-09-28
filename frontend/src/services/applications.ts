import type { Application, ApplicationStatus } from '../types/application'
import type { IsoDate, IsoDateTime } from '../types/common'
import type { Lease } from '../types/lease'
import type { Property } from '../types/property'
import type { Space, SpaceType } from '../types/space'
import type { TenantType } from '../types/tenant'
import { parseDisplayDate } from '../utils/date'
import { formatDate } from '../utils/format'
import { generateId } from '../utils/id'
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
  /** As typed, e.g. `1.11.2026`. */
  desiredStartDate: string
  message: string
}

/** Error codes per field; the UI translates them. */
export interface ApplicationFormErrors {
  applicantType?: 'invalid'
  name?: 'required' | 'tooLong'
  contactPerson?: 'tooLong'
  email?: 'required' | 'invalid' | 'tooLong' | 'duplicate'
  phone?: 'invalid'
  desiredStartDate?: 'required' | 'invalid' | 'past'
  message?: 'tooLong'
}

export function emptyApplicationForm(): ApplicationFormValues {
  return {
    applicantType: 'person',
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    desiredStartDate: '',
    message: '',
  }
}

export function toApplicationForm(application: Application): ApplicationFormValues {
  return {
    applicantType: application.applicantType,
    name: application.name,
    contactPerson: application.contactPerson ?? '',
    email: application.email,
    phone: application.phone ?? '',
    desiredStartDate: formatDate(application.desiredStartDate),
    message: application.message,
  }
}

/** The rules for sending a new application, which compare it with today and the stored applications. */
export interface NewApplicationContext {
  spaceId: string
  today: IsoDate
  applications: Pick<Application, 'spaceId' | 'email' | 'status'>[]
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

/**
 * Validates the form. With `context`, also the rules for a new application:
 * the desired start is today or later, and an email has at most one open
 * application per space.
 */
export function validateApplicationForm(
  values: ApplicationFormValues,
  context?: NewApplicationContext,
): ApplicationFormErrors {
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

  const startDate = parseDisplayDate(desiredStartDate)
  if (!desiredStartDate) errors.desiredStartDate = 'required'
  else if (!startDate) errors.desiredStartDate = 'invalid'
  else if (context && startDate < context.today) errors.desiredStartDate = 'past'

  if (values.message.trim().length > APPLICATION_MESSAGE_MAX_LENGTH) errors.message = 'tooLong'

  if (
    context &&
    !errors.email &&
    context.applications.some(
      (application) =>
        application.spaceId === context.spaceId &&
        isOpenApplication(application) &&
        normalizeEmail(application.email) === normalizeEmail(email),
    )
  ) {
    errors.email = 'duplicate'
  }

  return errors
}

/** A new, submitted application from valid form values. */
export function buildNewApplication(
  values: ApplicationFormValues,
  spaceId: string,
  now: IsoDateTime,
  id: string = generateId(),
): Application {
  const contactPerson = values.contactPerson.trim()
  return {
    id,
    spaceId,
    applicantType: values.applicantType,
    name: values.name.trim(),
    // A contact person only makes sense for a company.
    contactPerson: values.applicantType === 'company' && contactPerson ? contactPerson : null,
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    // Valid values always have a real date.
    desiredStartDate: parseDisplayDate(values.desiredStartDate) ?? '',
    message: values.message.trim(),
    status: 'submitted',
    decidedAt: null,
    tenantId: null,
    createdAt: now,
    updatedAt: now,
  }
}

/** A space that can be applied for, with its property, as listed on the public pages. */
export interface OpenSpace {
  space: Space
  property: Property
}

/** Spaces that can be applied for, by city, property and space name. */
export function listOpenSpaces(
  spaces: Space[],
  properties: Property[],
  leases: Lease[],
  today: IsoDate,
  locale: string,
): OpenSpace[] {
  const propertiesById = new Map(properties.map((property) => [property.id, property]))
  const collator = new Intl.Collator(locale, { numeric: true })
  return spaces
    .flatMap((space) => {
      const property = propertiesById.get(space.propertyId)
      return property && isSpaceOpenForApplications(space, leases, today) ? [{ space, property }] : []
    })
    .toSorted(
      (a, b) =>
        collator.compare(a.property.city, b.property.city) ||
        collator.compare(a.property.name, b.property.name) ||
        collator.compare(a.space.name, b.space.name),
    )
}

export interface OpenSpaceFilters {
  city: string
  type: SpaceType | ''
}

export function filterOpenSpaces(spaces: OpenSpace[], filters: OpenSpaceFilters): OpenSpace[] {
  return spaces.filter(
    ({ space, property }) =>
      (!filters.city || property.city === filters.city) && (!filters.type || space.type === filters.type),
  )
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
