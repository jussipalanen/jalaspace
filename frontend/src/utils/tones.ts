import type { LeaseStatus } from '../types/lease'
import type { MaintenancePriority, MaintenanceStatus } from '../types/maintenance'
import type { SpaceStatus } from '../types/space'

/** Visual tone of a status badge. Display text comes from the translations. */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export const maintenanceStatusTones: Record<MaintenanceStatus, Tone> = {
  open: 'info',
  in_progress: 'warning',
  completed: 'success',
}

export const maintenancePriorityTones: Record<MaintenancePriority, Tone> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
}

export const spaceStatusTones: Record<SpaceStatus, Tone> = {
  available: 'success',
  occupied: 'info',
  maintenance: 'warning',
}

export const leaseStatusTones: Record<LeaseStatus, Tone> = {
  upcoming: 'info',
  active: 'success',
  ended: 'neutral',
}
