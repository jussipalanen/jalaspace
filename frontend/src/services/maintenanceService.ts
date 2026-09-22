import type { DataLayer } from '../repositories'
import { EntityNotFoundError } from '../repositories/Repository'
import type { MaintenanceStatus, MaintenanceTask } from '../types/maintenance'
import type { Property } from '../types/property'
import type { Space } from '../types/space'
import { hasErrors } from '../utils/validation'
import {
  applyMaintenanceStatus,
  buildMaintenanceTask,
  isMaintenanceStatus,
  validateMaintenanceForm,
  type MaintenanceFormErrors,
  type MaintenanceFormValues,
} from './maintenance'

type Repositories = Pick<DataLayer, 'properties' | 'spaces' | 'maintenance'>

export class MaintenanceValidationError extends Error {
  readonly errors: MaintenanceFormErrors

  constructor(errors: MaintenanceFormErrors) {
    super('Invalid maintenance task')
    this.name = 'MaintenanceValidationError'
    this.errors = errors
  }
}

export interface MaintenanceData {
  maintenance: MaintenanceTask[]
  properties: Property[]
  spaces: Space[]
}

export async function loadMaintenanceData(data: Repositories): Promise<MaintenanceData> {
  const [maintenance, properties, spaces] = await Promise.all([
    data.maintenance.getAll(),
    data.properties.getAll(),
    data.spaces.getAll(),
  ])
  return { maintenance, properties, spaces }
}

export interface MaintenanceDetails {
  task: MaintenanceTask
  property: Property | null
  space: Space | null
}

/** One task with its property and space; `null` if the task does not exist. */
export function getMaintenanceDetails(
  maintenanceData: MaintenanceData,
  id: string,
): MaintenanceDetails | null {
  const task = maintenanceData.maintenance.find((item) => item.id === id)
  if (!task) return null
  return {
    task,
    property: maintenanceData.properties.find((property) => property.id === task.propertyId) ?? null,
    space: task.spaceId
      ? (maintenanceData.spaces.find((space) => space.id === task.spaceId) ?? null)
      : null,
  }
}

/**
 * Re-check against current data, since the form may have been open while
 * another tab deleted the property or space.
 */
async function validateForSave(data: Repositories, values: MaintenanceFormValues) {
  const [properties, spaces] = await Promise.all([data.properties.getAll(), data.spaces.getAll()])
  const errors = validateMaintenanceForm(values, properties, spaces)
  if (hasErrors(errors)) throw new MaintenanceValidationError(errors)
}

export async function createMaintenance(
  data: Repositories,
  values: MaintenanceFormValues,
  now: Date = new Date(),
): Promise<MaintenanceTask> {
  await validateForSave(data, values)
  return data.maintenance.create(buildMaintenanceTask(values, now.toISOString()))
}

export async function updateMaintenance(
  data: Repositories,
  id: string,
  values: MaintenanceFormValues,
  now: Date = new Date(),
): Promise<MaintenanceTask> {
  const existing = await data.maintenance.getById(id)
  if (!existing) throw new EntityNotFoundError(id)
  await validateForSave(data, values)
  return data.maintenance.update(buildMaintenanceTask(values, now.toISOString(), existing))
}

/**
 * Changes only the status, starting from the stored task so that a page
 * opened before another edit cannot overwrite it. Space statuses are not changed.
 */
export async function changeMaintenanceStatus(
  data: Repositories,
  id: string,
  status: MaintenanceStatus,
  now: Date = new Date(),
): Promise<MaintenanceTask> {
  if (!isMaintenanceStatus(status)) throw new MaintenanceValidationError({ status: 'invalid' })
  const task = await data.maintenance.getById(id)
  if (!task) throw new EntityNotFoundError(id)
  return data.maintenance.update(applyMaintenanceStatus(task, status, now.toISOString()))
}

/** Nothing refers to a maintenance task, so it can always be deleted. */
export async function deleteMaintenance(data: Repositories, id: string): Promise<void> {
  await data.maintenance.delete(id)
}
