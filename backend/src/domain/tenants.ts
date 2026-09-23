import { isRecord, readText, type Entity, type FieldErrorCode, type ParseResult } from './common.ts'

// The rules match the frontend (frontend/src/services/tenants.ts), so the UI
// can translate every field error the API returns. Change them together.

export const TENANT_TYPES = ['company', 'person'] as const

export type TenantType = (typeof TENANT_TYPES)[number]

export const TENANT_NAME_MAX_LENGTH = 100
export const TENANT_CONTACT_MAX_LENGTH = 100
export const TENANT_EMAIL_MAX_LENGTH = 254
export const TENANT_NOTES_MAX_LENGTH = 2000
export const TENANT_PHONE_MIN_LENGTH = 5
export const TENANT_PHONE_MAX_LENGTH = 20

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PHONE_PATTERN = /^[\d\s()+-]+$/

/** The fields a client may set; the server sets `id`, `createdAt` and `updatedAt`. */
export interface TenantInput {
  type: TenantType
  name: string
  /** Contact person for company tenants; always `null` for people. */
  contactPerson: string | null
  email: string
  phone: string | null
  notes: string
}

export interface Tenant extends Entity, TenantInput {}

export type TenantFieldErrors = Partial<Record<keyof TenantInput, FieldErrorCode>>

function isTenantType(value: unknown): value is TenantType {
  return (TENANT_TYPES as readonly unknown[]).includes(value)
}

/**
 * Checks a request body and returns the trimmed input, or an error code per
 * field. Unique emails are checked by `checkTenantEmail`.
 */
export function parseTenantInput(body: unknown): ParseResult<TenantInput> {
  const source = isRecord(body) ? body : {}
  const errors: TenantFieldErrors = {}

  const type = source.type
  if (type === undefined || type === null || type === '') errors.type = 'required'
  else if (!isTenantType(type)) errors.type = 'invalid'

  const name = readText(source, 'name')
  if (name === undefined) errors.name = 'invalid'
  else if (!name) errors.name = 'required'
  else if (name.length > TENANT_NAME_MAX_LENGTH) errors.name = 'tooLong'

  // Only companies have a contact person, so a person's is ignored, as in the app.
  const contactPerson = type === 'person' ? '' : readText(source, 'contactPerson')
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

  const notes = readText(source, 'notes')
  if (notes === undefined) errors.notes = 'invalid'
  else if (notes.length > TENANT_NOTES_MAX_LENGTH) errors.notes = 'tooLong'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    // Every field was checked above; the assertions only narrow the types.
    values: {
      type: type as TenantType,
      name: name!,
      contactPerson: contactPerson || null,
      email: email!,
      phone: phone || null,
      notes: notes!,
    },
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

/**
 * Emails are unique, ignoring case. `editingId` is the tenant being updated,
 * which may keep its own email. An empty result means it can be saved.
 */
export function checkTenantEmail(
  email: string,
  tenants: readonly Pick<Tenant, 'id' | 'email'>[],
  editingId?: string,
): TenantFieldErrors {
  const taken = tenants.some(
    (tenant) => tenant.id !== editingId && normalizeEmail(tenant.email) === normalizeEmail(email),
  )
  return taken ? { email: 'duplicate' } : {}
}

export interface TenantDeletionCheck {
  allowed: boolean
  leaseCount: number
}

/** A tenant can only be deleted when no lease, current, upcoming or past, refers to it. */
export function checkTenantDeletion(tenantId: string, leases: readonly { tenantId: string }[]): TenantDeletionCheck {
  const leaseCount = leases.filter((lease) => lease.tenantId === tenantId).length
  return { allowed: leaseCount === 0, leaseCount }
}
