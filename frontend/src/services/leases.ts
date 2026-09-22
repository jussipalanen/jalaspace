import type { IsoDate } from '../types/common'
import type { Lease, LeaseStatus } from '../types/lease'

/**
 * A lease is active from its start date through its end date (both inclusive).
 * Date-only ISO strings compare correctly as plain strings.
 */
export function getLeaseStatus(
  lease: Pick<Lease, 'startDate' | 'endDate'>,
  today: IsoDate,
): LeaseStatus {
  if (lease.startDate > today) return 'upcoming'
  if (lease.endDate !== null && lease.endDate < today) return 'ended'
  return 'active'
}
