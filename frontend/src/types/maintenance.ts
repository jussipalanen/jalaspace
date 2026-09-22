import type { Entity, IsoDate, IsoDateTime } from './common'

export type MaintenancePriority = 'low' | 'medium' | 'high'

export type MaintenanceStatus = 'open' | 'in_progress' | 'completed'

export type MaintenanceCategory =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'structural'
  | 'cleaning'
  | 'general'

export interface MaintenanceTask extends Entity {
  propertyId: string
  /** `null` when the task concerns the whole property or a common area. */
  spaceId: string | null
  title: string
  description: string
  category: MaintenanceCategory
  priority: MaintenancePriority
  status: MaintenanceStatus
  dueDate: IsoDate | null
  /** Set when the task is completed, otherwise `null`. */
  completedAt: IsoDateTime | null
}
