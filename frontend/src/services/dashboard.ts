import type { IsoDate } from '../types/common'
import type { Lease } from '../types/lease'
import type { MaintenanceTask } from '../types/maintenance'
import type { Property } from '../types/property'
import type { Space } from '../types/space'
import type { Tenant } from '../types/tenant'
import { toIsoDate } from '../utils/date'
import { getLeaseStatus } from './leases'
import { calculateOccupancy, isOpenMaintenance } from './metrics'

export interface DashboardInput {
  properties: Property[]
  spaces: Space[]
  tenants: Tenant[]
  leases: Lease[]
  maintenance: MaintenanceTask[]
}

export interface DashboardStats {
  propertyCount: number
  cityCount: number
  spaceCount: number
  availableSpaceCount: number
  occupiedSpaceCount: number
  /** Occupied spaces as a whole percentage of all spaces; `null` when there are no spaces. */
  occupancyPercent: number | null
  /** Tasks that are not completed (open or in progress). */
  openMaintenanceCount: number
  highPriorityOpenCount: number
}

export interface MaintenanceSummary {
  task: MaintenanceTask
  property: Property | null
  space: Space | null
}

export interface AvailableSpaceSummary {
  space: Space
  property: Property | null
  /** Start date of an upcoming lease on this space, if any. */
  reservedFrom: IsoDate | null
}

/**
 * New maintenance tasks are not included: they are already listed under
 * "Recent maintenance", and the feed would otherwise show little else.
 */
export type ActivityType = 'maintenance_completed' | 'lease_started' | 'lease_ended'

export interface ActivityItem {
  id: string
  type: ActivityType
  date: IsoDate
  /** Tenant, space and property details, as available. The UI translates `type`. */
  details: string
  /** In-app link to the related item. */
  href: string
}

export interface DashboardSummary {
  stats: DashboardStats
  recentMaintenance: MaintenanceSummary[]
  availableSpaces: AvailableSpaceSummary[]
  recentActivity: ActivityItem[]
}

export const DASHBOARD_LIST_LIMIT = 5
export const ACTIVITY_LIMIT = 6

const byNewest = <T>(getDate: (item: T) => string) => (a: T, b: T) =>
  getDate(b).localeCompare(getDate(a))

function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]))
}

/**
 * Builds everything the dashboard shows from repository data.
 * Pure function: `today` and the sorting `locale` are passed in so results
 * are deterministic.
 */
export function buildDashboardSummary(
  input: DashboardInput,
  today: IsoDate,
  locale = 'en-GB',
): DashboardSummary {
  const collator = new Intl.Collator(locale, { numeric: true })
  const propertiesById = indexById(input.properties)
  const spacesById = indexById(input.spaces)
  const tenantsById = indexById(input.tenants)

  const unfinishedTasks = input.maintenance.filter(isOpenMaintenance)

  const stats: DashboardStats = {
    propertyCount: input.properties.length,
    cityCount: new Set(input.properties.map((p) => p.city.trim().toLowerCase())).size,
    ...calculateOccupancy(input.spaces),
    openMaintenanceCount: unfinishedTasks.length,
    highPriorityOpenCount: unfinishedTasks.filter((task) => task.priority === 'high').length,
  }

  const recentMaintenance = input.maintenance
    .toSorted(byNewest((task) => task.createdAt))
    .slice(0, DASHBOARD_LIST_LIMIT)
    .map((task) => ({
      task,
      property: propertiesById.get(task.propertyId) ?? null,
      space: task.spaceId ? (spacesById.get(task.spaceId) ?? null) : null,
    }))

  const upcomingStartBySpace = new Map<string, IsoDate>()
  for (const lease of input.leases) {
    if (getLeaseStatus(lease, today) !== 'upcoming') continue
    const current = upcomingStartBySpace.get(lease.spaceId)
    if (!current || lease.startDate < current) upcomingStartBySpace.set(lease.spaceId, lease.startDate)
  }

  const availableSpaces = input.spaces
    .filter((space) => space.status === 'available')
    .map((space) => ({
      space,
      property: propertiesById.get(space.propertyId) ?? null,
      reservedFrom: upcomingStartBySpace.get(space.id) ?? null,
    }))
    .toSorted(
      (a, b) =>
        collator.compare(a.property?.name ?? '', b.property?.name ?? '') ||
        collator.compare(a.space.name, b.space.name),
    )

  const describeSpace = (spaceId: string | null): string => {
    const space = spaceId ? spacesById.get(spaceId) : undefined
    const property = space ? propertiesById.get(space.propertyId) : undefined
    return [space?.name, property?.name].filter(Boolean).join(', ')
  }

  const activity: ActivityItem[] = []

  for (const task of input.maintenance) {
    const property = propertiesById.get(task.propertyId)
    const space = task.spaceId ? spacesById.get(task.spaceId) : undefined
    const details = [task.title, space?.name, property?.name].filter(Boolean).join(', ')
    if (task.completedAt) {
      activity.push({
        id: `${task.id}-completed`,
        type: 'maintenance_completed',
        date: toIsoDate(new Date(task.completedAt)),
        details,
        href: `/maintenance/${task.id}`,
      })
    }
  }

  for (const lease of input.leases) {
    const tenant = tenantsById.get(lease.tenantId)
    const details = [tenant?.name, describeSpace(lease.spaceId)].filter(Boolean).join(', ')
    const href = tenant ? `/tenants/${tenant.id}` : '/leases'

    if (lease.startDate <= today) {
      activity.push({
        id: `${lease.id}-started`,
        type: 'lease_started',
        date: lease.startDate,
        details,
        href,
      })
    }
    if (lease.endDate !== null && lease.endDate < today) {
      activity.push({
        id: `${lease.id}-ended`,
        type: 'lease_ended',
        date: lease.endDate,
        details,
        href,
      })
    }
  }

  const recentActivity = activity
    .filter((item) => item.date <= today)
    .toSorted((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
    .slice(0, ACTIVITY_LIMIT)

  return { stats, recentMaintenance, availableSpaces, recentActivity }
}
