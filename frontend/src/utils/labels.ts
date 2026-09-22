import type { MaintenancePriority, MaintenanceStatus } from '../types/maintenance'
import type { SpaceStatus, SpaceType } from '../types/space'

export const maintenanceStatusLabels: Record<MaintenanceStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  completed: 'Completed',
}

export const maintenancePriorityLabels: Record<MaintenancePriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const spaceStatusLabels: Record<SpaceStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  maintenance: 'Maintenance',
}

export const spaceTypeLabels: Record<SpaceType, string> = {
  office: 'Office',
  retail: 'Retail',
  industrial: 'Industrial',
  storage: 'Storage',
  apartment: 'Apartment',
}

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
