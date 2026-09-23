import type { MaintenanceTask } from '../domain/maintenance.ts'

/** A valid open task for tests that only care about some fields, e.g. its property and space. */
export function maintenanceTask(overrides: Partial<MaintenanceTask> & Pick<MaintenanceTask, 'id'>): MaintenanceTask {
  return {
    propertyId: 'property-1',
    spaceId: null,
    title: 'Leaking tap',
    description: '',
    category: 'plumbing',
    priority: 'medium',
    status: 'open',
    dueDate: null,
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}
