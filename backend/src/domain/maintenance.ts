// The same values as the frontend (frontend/src/services/maintenance.ts). Change them together.

export const MAINTENANCE_CATEGORIES = [
  'plumbing',
  'electrical',
  'hvac',
  'structural',
  'cleaning',
  'general',
] as const

export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number]

export const MAINTENANCE_PRIORITIES = ['low', 'medium', 'high'] as const

export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number]

export const MAINTENANCE_TITLE_MAX_LENGTH = 120

export function isMaintenanceCategory(value: unknown): value is MaintenanceCategory {
  return (MAINTENANCE_CATEGORIES as readonly unknown[]).includes(value)
}

export function isMaintenancePriority(value: unknown): value is MaintenancePriority {
  return (MAINTENANCE_PRIORITIES as readonly unknown[]).includes(value)
}
