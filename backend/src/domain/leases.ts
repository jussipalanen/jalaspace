import type { Store } from '../store/store.ts'
import {
  isIsoDate,
  isRecord,
  readText,
  type Entity,
  type FieldErrorCode,
  type IsoDate,
  type ParseResult,
} from './common.ts'
import { resolveSpaceStatus, type Space } from './spaces.ts'

// The rules match the frontend (frontend/src/services/leases.ts and
// leaseService.ts), so the UI can translate every field error the API
// returns. Change them together.

/** Derived from the lease period, never stored; see `getLeaseStatus`. */
export type LeaseStatus = 'upcoming' | 'active' | 'ended'

/** Upper limit for a monthly rent: 1 000 000 € in cents. */
export const MONTHLY_RENT_MAX_CENTS = 100_000_000

/** The fields a client may set; the server sets `id`, `createdAt` and `updatedAt`. */
export interface LeaseInput {
  tenantId: string
  spaceId: string
  startDate: IsoDate
  /** `null` for an open-ended lease. */
  endDate: IsoDate | null
  /** Optional monthly rent in euro cents, to avoid floating-point rounding. */
  monthlyRentCents: number | null
}

export interface Lease extends Entity, LeaseInput {}

export type LeasePeriod = Pick<Lease, 'startDate' | 'endDate'>

export type LeaseFieldErrors = Partial<Record<keyof LeaseInput, FieldErrorCode>>

/** Today's date on the server, as a date-only ISO string (UTC). */
export const toIsoDate = (date: Date): IsoDate => date.toISOString().slice(0, 10)

/**
 * A lease is active from its start date through its end date (both inclusive).
 * Date-only ISO strings compare correctly as plain strings.
 */
export function getLeaseStatus(lease: LeasePeriod, today: IsoDate): LeaseStatus {
  if (lease.startDate > today) return 'upcoming'
  if (lease.endDate !== null && lease.endDate < today) return 'ended'
  return 'active'
}

/** True when two lease periods share at least one day; a `null` end runs indefinitely. */
export function periodsOverlap(a: LeasePeriod, b: LeasePeriod): boolean {
  return (b.endDate === null || a.startDate <= b.endDate) && (a.endDate === null || b.startDate <= a.endDate)
}

/** True when the space has a lease that is active today. */
export function hasActiveLease(
  spaceId: string,
  leases: readonly (LeasePeriod & { spaceId: string })[],
  today: IsoDate,
): boolean {
  return leases.some((lease) => lease.spaceId === spaceId && getLeaseStatus(lease, today) === 'active')
}

/** Checks a request body and returns the cleaned input, or an error code per field. */
export function parseLeaseInput(body: unknown): ParseResult<LeaseInput> {
  const source = isRecord(body) ? body : {}
  const errors: LeaseFieldErrors = {}

  const tenantId = readText(source, 'tenantId')
  if (tenantId === undefined) errors.tenantId = 'invalid'
  else if (!tenantId) errors.tenantId = 'required'

  const spaceId = readText(source, 'spaceId')
  if (spaceId === undefined) errors.spaceId = 'invalid'
  else if (!spaceId) errors.spaceId = 'required'

  const startDate = readText(source, 'startDate')
  if (startDate === undefined) errors.startDate = 'invalid'
  else if (!startDate) errors.startDate = 'required'
  else if (!isIsoDate(startDate)) errors.startDate = 'invalid'

  // Missing, null or empty: an open-ended lease.
  const endDate = readText(source, 'endDate')
  if (endDate === undefined || (endDate && !isIsoDate(endDate))) errors.endDate = 'invalid'
  else if (endDate && !errors.startDate && endDate < startDate!) errors.endDate = 'beforeStart'

  const rent = source.monthlyRentCents
  const noRent = rent === undefined || rent === null || rent === ''
  if (
    !noRent &&
    (typeof rent !== 'number' || !Number.isInteger(rent) || rent <= 0 || rent > MONTHLY_RENT_MAX_CENTS)
  ) {
    errors.monthlyRentCents = 'invalid'
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    // Every field was checked above; the assertions only narrow the types.
    values: {
      tenantId: tenantId!,
      spaceId: spaceId!,
      startDate: startDate!,
      endDate: endDate || null,
      monthlyRentCents: noRent ? null : (rent as number),
    },
  }
}

export interface LeaseReferenceData {
  tenantExists: boolean
  /** The lease's space, or `null` if it does not exist. */
  space: Pick<Space, 'id' | 'status'> | null
  leases: readonly Pick<Lease, 'id' | 'spaceId' | 'startDate' | 'endDate'>[]
  today: IsoDate
  /** The lease being updated; it does not overlap with itself. */
  editingId?: string
}

/**
 * Checks the input against the current data: the tenant and space must exist,
 * the period must not overlap another lease of the space, and a lease that is
 * active today cannot start on a space in maintenance. An empty result means
 * it can be saved.
 */
export function checkLeaseReferences(input: LeaseInput, data: LeaseReferenceData): LeaseFieldErrors {
  const errors: LeaseFieldErrors = {}
  const { space } = data
  if (!data.tenantExists) errors.tenantId = 'notFound'

  if (!space) errors.spaceId = 'notFound'
  else if (
    data.leases.some(
      (lease) => lease.spaceId === space.id && lease.id !== data.editingId && periodsOverlap(lease, input),
    )
  ) {
    errors.spaceId = 'overlap'
  } else if (space.status === 'maintenance' && getLeaseStatus(input, data.today) === 'active') {
    errors.spaceId = 'maintenance'
  }
  return errors
}

/**
 * Spaces whose stored status no longer matches their leases today, with the
 * corrected status: occupied while a lease is active, otherwise not occupied.
 */
export function reconcileSpaceStatuses(
  spaces: readonly Space[],
  leases: readonly (LeasePeriod & { spaceId: string })[],
  today: IsoDate,
): Space[] {
  return spaces.flatMap((space) => {
    const status = resolveSpaceStatus(space.status, hasActiveLease(space.id, leases, today))
    return status === space.status ? [] : [{ ...space, status }]
  })
}

/**
 * Brings stored space statuses in line with the leases today, e.g. after a
 * lease is saved, or when a lease has started or ended since the last request.
 * Only the given spaces are checked when `spaceIds` is set.
 */
export async function syncSpaceStatuses(store: Store, now: Date, spaceIds?: readonly string[]): Promise<void> {
  const [spaces, leases] = await Promise.all([store.spaces.list(), store.leases.list()])
  const checked = spaceIds ? spaces.filter((space) => spaceIds.includes(space.id)) : spaces
  const timestamp = now.toISOString()
  for (const space of reconcileSpaceStatuses(checked, leases, toIsoDate(now))) {
    await store.spaces.update({ ...space, updatedAt: timestamp })
  }
}
