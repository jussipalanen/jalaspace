import type { Lease } from '../domain/leases.ts'
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

/** An open-ended lease that started in 2020, so it is active today unless the test changes the dates. */
export function lease(overrides: Partial<Lease> & Pick<Lease, 'id'>): Lease {
  return {
    tenantId: 'tenant-1',
    spaceId: 'space-1',
    startDate: '2020-01-01',
    endDate: null,
    monthlyRentCents: null,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    ...overrides,
  }
}
