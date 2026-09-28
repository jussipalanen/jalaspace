import type { Application } from '../types/application'
import type { IsoDate } from '../types/common'
import type { Lease } from '../types/lease'
import type { MaintenancePriority, MaintenanceTask } from '../types/maintenance'
import type { Property } from '../types/property'
import type { Space } from '../types/space'
import type { Tenant } from '../types/tenant'
import { toIsoDate } from '../utils/date'
import { isOpenApplication } from './applications'
import { getLeaseStatus } from './leases'
import { calculateOccupancy, isOpenMaintenance } from './metrics'

export interface DashboardInput {
  properties: Property[]
  spaces: Space[]
  tenants: Tenant[]
  leases: Lease[]
  maintenance: MaintenanceTask[]
  applications: Application[]
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
  /** Every space in exactly one state, so the counts add up to `spaceCount`. */
  spaceBreakdown: SpaceBreakdown
  /** Open maintenance tasks by priority; they add up to `openMaintenanceCount`. */
  openMaintenanceByPriority: Record<MaintenancePriority, number>
  /** Applications waiting for a decision: submitted or in review. */
  openApplicationCount: number
  /** Open applications: new (submitted) and in review; they add up to `openApplicationCount`. */
  openApplicationsByStatus: { submitted: number; in_review: number }
}

/**
 * Spaces by state for the Dashboard chart. `available` and `reserved` split the
 * available spaces: reserved ones have an upcoming lease (Available spaces).
 */
export interface SpaceBreakdown {
  occupied: number
  available: number
  reserved: number
  maintenance: number
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
  /** Applications for this space waiting for a decision. */
  openApplicationCount: number
}

export interface ApplicationSummary {
  application: Application
  space: Space | null
  property: Property | null
}

/**
 * New maintenance tasks are not included: they are already listed under
 * "Recent maintenance", and the feed would otherwise show little else.
 */
export type ActivityType =
  | 'maintenance_completed'
  | 'lease_started'
  | 'lease_ended'
  | 'application_received'
  | 'application_approved'

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
  /** The newest applications, whatever their status. */
  latestApplications: ApplicationSummary[]
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
  const openApplications = input.applications.filter(isOpenApplication)
  const openApplicationsBySpace = new Map<string, number>()
  for (const application of openApplications) {
    openApplicationsBySpace.set(application.spaceId, (openApplicationsBySpace.get(application.spaceId) ?? 0) + 1)
  }
  const countPriority = (priority: MaintenancePriority) =>
    unfinishedTasks.filter((task) => task.priority === priority).length

  const upcomingStartBySpace = new Map<string, IsoDate>()
  for (const lease of input.leases) {
    if (getLeaseStatus(lease, today) !== 'upcoming') continue
    const current = upcomingStartBySpace.get(lease.spaceId)
    if (!current || lease.startDate < current) upcomingStartBySpace.set(lease.spaceId, lease.startDate)
  }

  const countStatus = (status: Space['status']) => input.spaces.filter((space) => space.status === status).length
  const reserved = input.spaces.filter(
    (space) => space.status === 'available' && upcomingStartBySpace.has(space.id),
  ).length

  const stats: DashboardStats = {
    propertyCount: input.properties.length,
    cityCount: new Set(input.properties.map((p) => p.city.trim().toLowerCase())).size,
    ...calculateOccupancy(input.spaces),
    openMaintenanceCount: unfinishedTasks.length,
    spaceBreakdown: {
      occupied: countStatus('occupied'),
      available: countStatus('available') - reserved,
      reserved,
      maintenance: countStatus('maintenance'),
    },
    openMaintenanceByPriority: { high: countPriority('high'), medium: countPriority('medium'), low: countPriority('low') },
    openApplicationCount: openApplications.length,
    openApplicationsByStatus: {
      submitted: openApplications.filter((application) => application.status === 'submitted').length,
      in_review: openApplications.filter((application) => application.status === 'in_review').length,
    },
  }

  const recentMaintenance = input.maintenance
    .toSorted(byNewest((task) => task.createdAt))
    .slice(0, DASHBOARD_LIST_LIMIT)
    .map((task) => ({
      task,
      property: propertiesById.get(task.propertyId) ?? null,
      space: task.spaceId ? (spacesById.get(task.spaceId) ?? null) : null,
    }))

  const availableSpaces = input.spaces
    .filter((space) => space.status === 'available')
    .map((space) => ({
      space,
      property: propertiesById.get(space.propertyId) ?? null,
      reservedFrom: upcomingStartBySpace.get(space.id) ?? null,
      openApplicationCount: openApplicationsBySpace.get(space.id) ?? 0,
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

  for (const application of input.applications) {
    const details = [application.name, describeSpace(application.spaceId)].filter(Boolean).join(', ')
    const href = `/applications/${application.id}`
    activity.push({
      id: `${application.id}-received`,
      type: 'application_received',
      date: toIsoDate(new Date(application.createdAt)),
      details,
      href,
    })
    if (application.status === 'approved' && application.decidedAt) {
      activity.push({
        id: `${application.id}-approved`,
        type: 'application_approved',
        date: toIsoDate(new Date(application.decidedAt)),
        details,
        href,
      })
    }
  }

  const latestApplications = input.applications
    .toSorted(byNewest((application) => application.createdAt))
    .slice(0, DASHBOARD_LIST_LIMIT)
    .map((application) => {
      const space = spacesById.get(application.spaceId) ?? null
      return { application, space, property: space ? (propertiesById.get(space.propertyId) ?? null) : null }
    })

  const recentActivity = activity
    .filter((item) => item.date <= today)
    .toSorted((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
    .slice(0, ACTIVITY_LIMIT)

  return { stats, recentMaintenance, availableSpaces, latestApplications, recentActivity }
}
