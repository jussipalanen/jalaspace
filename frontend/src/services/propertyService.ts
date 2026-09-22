import type { DataLayer } from '../repositories'
import { EntityNotFoundError } from '../repositories/Repository'
import type { MaintenanceTask } from '../types/maintenance'
import type { Property } from '../types/property'
import type { Space } from '../types/space'
import { calculateOccupancy, isOpenMaintenance, type OccupancyMetrics } from './metrics'
import {
  applyPropertyChanges,
  buildNewProperty,
  checkPropertyDeletion,
  summarizeProperties,
  type PropertyDeletionCheck,
  type PropertyFormValues,
  type PropertySummary,
} from './properties'

type Repositories = Pick<DataLayer, 'properties' | 'spaces' | 'maintenance'>

export class PropertyDeletionBlockedError extends Error {
  readonly check: PropertyDeletionCheck

  constructor(check: PropertyDeletionCheck) {
    super('Property still has spaces or maintenance tasks')
    this.name = 'PropertyDeletionBlockedError'
    this.check = check
  }
}

export interface PropertyListData {
  properties: Property[]
  spaces: Space[]
  maintenance: MaintenanceTask[]
}

export async function loadPropertyListData(data: Repositories): Promise<PropertyListData> {
  const [properties, spaces, maintenance] = await Promise.all([
    data.properties.getAll(),
    data.spaces.getAll(),
    data.maintenance.getAll(),
  ])
  return { properties, spaces, maintenance }
}

export function toPropertySummaries(list: PropertyListData, locale: string): PropertySummary[] {
  return summarizeProperties(list.properties, list.spaces, list.maintenance, locale)
}

export interface PropertyDetails {
  property: Property
  metrics: OccupancyMetrics & { openMaintenanceCount: number }
  spaces: Space[]
  openMaintenance: MaintenanceTask[]
  deletion: PropertyDeletionCheck
}

/** Loads a property with its spaces and open maintenance; `null` if it does not exist. */
export async function loadPropertyDetails(
  data: Repositories,
  id: string,
): Promise<PropertyDetails | null> {
  const [property, allSpaces, allMaintenance] = await Promise.all([
    data.properties.getById(id),
    data.spaces.getAll(),
    data.maintenance.getAll(),
  ])
  if (!property) return null

  const spaces = allSpaces.filter((space) => space.propertyId === id)
  const openMaintenance = allMaintenance
    .filter((task) => task.propertyId === id && isOpenMaintenance(task))
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    property,
    metrics: { ...calculateOccupancy(spaces), openMaintenanceCount: openMaintenance.length },
    spaces,
    openMaintenance,
    deletion: checkPropertyDeletion(id, allSpaces, allMaintenance),
  }
}

export async function createProperty(
  data: Repositories,
  values: PropertyFormValues,
  now: Date = new Date(),
): Promise<Property> {
  return data.properties.create(buildNewProperty(values, now.toISOString()))
}

export async function updateProperty(
  data: Repositories,
  id: string,
  values: PropertyFormValues,
  now: Date = new Date(),
): Promise<Property> {
  const existing = await data.properties.getById(id)
  if (!existing) throw new EntityNotFoundError(id)
  return data.properties.update(applyPropertyChanges(existing, values, now.toISOString()))
}

/**
 * Deletes a property after re-checking, with current data, that nothing
 * refers to it. Throws `PropertyDeletionBlockedError` otherwise.
 */
export async function deleteProperty(data: Repositories, id: string): Promise<void> {
  const [spaces, maintenance] = await Promise.all([data.spaces.getAll(), data.maintenance.getAll()])
  const check = checkPropertyDeletion(id, spaces, maintenance)
  if (!check.allowed) throw new PropertyDeletionBlockedError(check)
  await data.properties.delete(id)
}
