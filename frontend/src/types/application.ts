import type { Entity, IsoDate, IsoDateTime } from './common'
import type { TenantType } from './tenant'

export type ApplicationStatus = 'submitted' | 'in_review' | 'approved' | 'rejected' | 'withdrawn'

/** A rental application for a space, sent by someone looking for a space. */
export interface Application extends Entity {
  spaceId: string
  applicantType: TenantType
  name: string
  /** Contact person for company applicants. */
  contactPerson: string | null
  email: string
  phone: string | null
  desiredStartDate: IsoDate
  message: string
  /** Stored, unlike a lease's status: it records a decision, not dates. */
  status: ApplicationStatus
  /** Set when the application is approved, rejected or withdrawn, otherwise `null`. */
  decidedAt: IsoDateTime | null
  /** The tenant an approved application became, otherwise `null`. */
  tenantId: string | null
}
