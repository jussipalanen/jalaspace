import type { Entity } from './common'

export type TenantType = 'company' | 'person'

export interface Tenant extends Entity {
  type: TenantType
  name: string
  /** Contact person for company tenants. */
  contactPerson: string | null
  email: string
  phone: string | null
  notes: string
}
