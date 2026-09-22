import type { Entity, IsoDate } from './common'

/** Derived from the lease period; see `getLeaseStatus`. */
export type LeaseStatus = 'upcoming' | 'active' | 'ended'

export interface Lease extends Entity {
  tenantId: string
  spaceId: string
  startDate: IsoDate
  /** `null` for an open-ended lease. */
  endDate: IsoDate | null
  /** Optional monthly rent in euro cents, to avoid floating-point rounding. */
  monthlyRentCents: number | null
}
