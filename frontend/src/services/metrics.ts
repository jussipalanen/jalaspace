import type { MaintenanceTask } from '../types/maintenance'
import type { Space } from '../types/space'

/** Shared metric definitions (see "Dashboard" in CLAUDE.md), used by every view. */

export interface OccupancyMetrics {
  spaceCount: number
  occupiedSpaceCount: number
  availableSpaceCount: number
  /** Occupied spaces as a whole percentage of all spaces; `null` when there are no spaces. */
  occupancyPercent: number | null
}

export function calculateOccupancy(spaces: Space[]): OccupancyMetrics {
  const occupiedSpaceCount = spaces.filter((space) => space.status === 'occupied').length
  return {
    spaceCount: spaces.length,
    occupiedSpaceCount,
    availableSpaceCount: spaces.filter((space) => space.status === 'available').length,
    occupancyPercent:
      spaces.length === 0 ? null : Math.round((occupiedSpaceCount / spaces.length) * 100),
  }
}

/** Open maintenance means every task that is not completed (open or in progress). */
export function isOpenMaintenance(task: MaintenanceTask): boolean {
  return task.status !== 'completed'
}
