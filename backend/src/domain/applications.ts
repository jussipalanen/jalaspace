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
import { getLeaseStatus, type LeasePeriod } from './leases.ts'
import {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  TENANT_CONTACT_MAX_LENGTH,
  TENANT_EMAIL_MAX_LENGTH,
  TENANT_NAME_MAX_LENGTH,
  TENANT_PHONE_MAX_LENGTH,
  TENANT_PHONE_MIN_LENGTH,
  TENANT_TYPES,
  type TenantType,
} from './tenants.ts'

// The rules match the frontend (frontend/src/services/applications.ts), so the
// UI can translate every field error the API returns. Change them together.
// The applicant's details follow the tenant rules, except that the email does
// not have to be unique: one person may apply for several spaces.

export const APPLICATION_STATUSES = ['submitted', 'in_review', 'approved', 'rejected', 'withdrawn'] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const APPLICATION_MESSAGE_MAX_LENGTH = 2000

/** The status changes allowed from each status; `approved`, `rejected` and `withdrawn` are final. */
export const APPLICATION_STATUS_CHANGES: Readonly<Record<ApplicationStatus, readonly ApplicationStatus[]>> = {
  submitted: ['in_review', 'approved', 'rejected', 'withdrawn'],
  in_review: ['approved', 'rejected', 'withdrawn'],
  approved: [],
  rejected: [],
  withdrawn: [],
}

/** The fields a client may set; the server sets `id`, the timestamps and `decidedAt`. */
export interface ApplicationInput {
  spaceId: string
  applicantType: TenantType
  name: string
  /** Contact person for company applicants; always `null` for people. */
  contactPerson: string | null
  email: string
  phone: string | null
  desiredStartDate: IsoDate
  message: string
  status: ApplicationStatus
  /** The tenant an approved application became; `null` until then. */
  tenantId: string | null
}

export interface Application extends Entity, ApplicationInput {
  /** When the application was approved, rejected or withdrawn; `null` while it is open. */
  decidedAt: IsoDateTime | null
}

export type ApplicationFieldErrors = Partial<Record<keyof ApplicationInput, FieldErrorCode>>

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly unknown[]).includes(value)
}

/** Submitted and in review applications still wait for a decision. */
export function isOpenApplication(application: { status: ApplicationStatus }): boolean {
  return application.status === 'submitted' || application.status === 'in_review'
}

/**
 * A space can be applied for while it is available and not reserved, i.e.
 * no upcoming lease is waiting for it (the Dashboard's "Available spaces").
 */
export function isSpaceOpenForApplications(
  space: { id: string; status: string },
  leases: readonly (LeasePeriod & { spaceId: string })[],
  today: IsoDate,
): boolean {
  return (
    space.status === 'available' &&
    !leases.some((lease) => lease.spaceId === space.id && getLeaseStatus(lease, today) === 'upcoming')
  )
}

/** True when the status may change from `from` to `to`; keeping the same status is always allowed. */
export function canChangeApplicationStatus(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return from === to || APPLICATION_STATUS_CHANGES[from].includes(to)
}

/** `decidedAt` after a status change: set when the application reaches a final status, kept after that. */
export function resolveDecidedAt(
  status: ApplicationStatus,
  existing: Pick<Application, 'decidedAt'> | null,
  now: IsoDateTime,
): IsoDateTime | null {
  if (isOpenApplication({ status })) return null
  return existing?.decidedAt ?? now
}

/** Checks a request body and returns the trimmed input, or an error code per field. */
export function parseApplicationInput(body: unknown): ParseResult<ApplicationInput> {
  const source = isRecord(body) ? body : {}
  const errors: ApplicationFieldErrors = {}

  const spaceId = readText(source, 'spaceId')
  if (spaceId === undefined) errors.spaceId = 'invalid'
  else if (!spaceId) errors.spaceId = 'required'

  const applicantType = source.applicantType
  if (applicantType === undefined || applicantType === null || applicantType === '') errors.applicantType = 'required'
  else if (!(TENANT_TYPES as readonly unknown[]).includes(applicantType)) errors.applicantType = 'invalid'

  const name = readText(source, 'name')
  if (name === undefined) errors.name = 'invalid'
  else if (!name) errors.name = 'required'
  else if (name.length > TENANT_NAME_MAX_LENGTH) errors.name = 'tooLong'

  // Only companies have a contact person, so a person's is ignored, as for tenants.
  const contactPerson = applicantType === 'person' ? '' : readText(source, 'contactPerson')
  if (contactPerson === undefined) errors.contactPerson = 'invalid'
  else if (contactPerson.length > TENANT_CONTACT_MAX_LENGTH) errors.contactPerson = 'tooLong'

  const email = readText(source, 'email')
  if (email === undefined) errors.email = 'invalid'
  else if (!email) errors.email = 'required'
  else if (email.length > TENANT_EMAIL_MAX_LENGTH) errors.email = 'tooLong'
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'invalid'

  const phone = readText(source, 'phone')
  if (
    phone === undefined ||
    (phone &&
      (!PHONE_PATTERN.test(phone) ||
        phone.length < TENANT_PHONE_MIN_LENGTH ||
        phone.length > TENANT_PHONE_MAX_LENGTH))
  ) {
    errors.phone = 'invalid'
  }

  const desiredStartDate = readText(source, 'desiredStartDate')
  if (desiredStartDate === undefined) errors.desiredStartDate = 'invalid'
  else if (!desiredStartDate) errors.desiredStartDate = 'required'
  else if (!isIsoDate(desiredStartDate)) errors.desiredStartDate = 'invalid'

  const message = readText(source, 'message')
  if (message === undefined) errors.message = 'invalid'
  else if (message.length > APPLICATION_MESSAGE_MAX_LENGTH) errors.message = 'tooLong'

  // A missing status is a new application, as sent by the public form.
  const status = source.status ?? 'submitted'
  if (!isApplicationStatus(status)) errors.status = 'invalid'

  const tenantId = readText(source, 'tenantId')
  if (tenantId === undefined) errors.tenantId = 'invalid'
  // Only an approved application refers to the tenant it became.
  else if (status === 'approved' && !tenantId) errors.tenantId = 'required'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    // Every field was checked above; the assertions only narrow the types.
    values: {
      spaceId: spaceId!,
      applicantType: applicantType as TenantType,
      name: name!,
      contactPerson: contactPerson || null,
      email: email!,
      phone: phone || null,
      desiredStartDate: desiredStartDate!,
      message: message!,
      status: status as ApplicationStatus,
      tenantId: status === 'approved' ? tenantId! : null,
    },
  }
}

export interface ApplicationReferenceData {
  spaceExists: boolean
  tenantExists: boolean
}

/** Checks that the space, and the tenant of an approved application, exist. */
export function checkApplicationReferences(
  input: ApplicationInput,
  { spaceExists, tenantExists }: ApplicationReferenceData,
): ApplicationFieldErrors {
  const errors: ApplicationFieldErrors = {}
  if (!spaceExists) errors.spaceId = 'notFound'
  if (input.tenantId !== null && !tenantExists) errors.tenantId = 'notFound'
  return errors
}
