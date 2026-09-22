import type { MaintenancePriority, MaintenanceStatus } from '../types/maintenance'

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
