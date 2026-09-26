import { beforeEach, describe, expect, it } from 'vitest'
import { createDataLayer } from '../repositories'
import { LocalStorageDemoDataStore } from '../repositories/localStorage/LocalStorageDemoDataStore'
import { EntityNotFoundError } from '../repositories/Repository'
import { initializeDemoData } from './demoDataService'
import type { MaintenanceFormValues } from './maintenance'
import {
  changeMaintenanceStatus,
  createMaintenance,
  deleteMaintenance,
  getMaintenanceDetails,
  loadMaintenanceData,
  MaintenanceValidationError,
  updateMaintenance,
} from './maintenanceService'

const values: MaintenanceFormValues = {
  propertyId: 'property-joensuu-center',
  spaceId: 'space-joensuu-center-1',
  title: 'Broken window',
  description: 'Cracked glass in the shop window.',
  category: 'structural',
  priority: 'high',
  status: 'open',
  dueDate: '30.9.2026',
}
const now = new Date('2026-09-22T10:30:00.000Z')
const later = new Date('2026-09-25T08:00:00.000Z')

describe('maintenance service', () => {
  beforeEach(async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
  })

  it('creates a task that survives a page refresh', async () => {
    const created = await createMaintenance(createDataLayer('localStorage'), values, now)

    const reloaded = await createDataLayer('localStorage').maintenance.getById(created.id)
    expect(reloaded).toEqual(created)
    expect(reloaded).toMatchObject({ dueDate: '2026-09-30', status: 'open', completedAt: null })
  })

  it('rejects invalid values and a space of another property before persisting', async () => {
    const data = createDataLayer('localStorage')
    const before = await data.maintenance.getAll()

    await expect(createMaintenance(data, { ...values, title: ' ' })).rejects.toMatchObject({
      errors: { title: 'required' },
    })
    const error = await createMaintenance(data, {
      ...values,
      spaceId: 'space-kuopio-harbour-1',
    }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(MaintenanceValidationError)
    expect(error).toMatchObject({ errors: { spaceId: 'invalid' } })
    expect(await data.maintenance.getAll()).toHaveLength(before.length)
  })

  it('revalidates against current data when the property or space was deleted meanwhile', async () => {
    const data = createDataLayer('localStorage')
    const property = await data.properties.create({
      id: 'new-property',
      name: 'Oulu Depot',
      type: 'industrial',
      address: 'Satamatie 1',
      postalCode: '90100',
      city: 'Oulu',
      description: '',
      location: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })
    const space = await data.spaces.create({
      id: 'new-space',
      propertyId: property.id,
      name: 'Hall 1',
      type: 'industrial',
      floor: 1,
      areaM2: 500,
      rooms: null,
      features: [],
      status: 'available',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })
    // Another tab deletes the space, then the property.
    await data.spaces.delete(space.id)
    await expect(
      createMaintenance(data, { ...values, propertyId: property.id, spaceId: space.id }),
    ).rejects.toMatchObject({ errors: { spaceId: 'invalid' } })

    await data.properties.delete(property.id)
    await expect(
      createMaintenance(data, { ...values, propertyId: property.id, spaceId: '' }),
    ).rejects.toMatchObject({ errors: { propertyId: 'notFound' } })
  })

  it('updates a task, keeping its identity and completion time', async () => {
    const data = createDataLayer('localStorage')
    const created = await createMaintenance(data, { ...values, status: 'completed' }, now)

    const updated = await updateMaintenance(
      data,
      created.id,
      { ...values, status: 'completed', title: 'Replace shop window', spaceId: '' },
      later,
    )

    expect(updated).toMatchObject({
      id: created.id,
      title: 'Replace shop window',
      spaceId: null,
      createdAt: now.toISOString(),
      updatedAt: later.toISOString(),
      completedAt: now.toISOString(),
    })
  })

  it('rejects updating or changing the status of a missing task', async () => {
    const data = createDataLayer('localStorage')
    await expect(updateMaintenance(data, 'missing', values)).rejects.toBeInstanceOf(
      EntityNotFoundError,
    )
    await expect(changeMaintenanceStatus(data, 'missing', 'completed')).rejects.toBeInstanceOf(
      EntityNotFoundError,
    )
  })

  it('completes, reopens and completes a task again', async () => {
    const data = createDataLayer('localStorage')

    const completed = await changeMaintenanceStatus(data, 'maintenance-3', 'completed', now)
    expect(completed).toMatchObject({ status: 'completed', completedAt: now.toISOString() })

    const reopened = await changeMaintenanceStatus(data, 'maintenance-3', 'open', later)
    expect(reopened).toMatchObject({ status: 'open', completedAt: null })

    const again = await changeMaintenanceStatus(data, 'maintenance-3', 'completed', later)
    expect(again.completedAt).toBe(later.toISOString())
    expect(await data.maintenance.getById('maintenance-3')).toEqual(again)
  })

  it('changes only the status, keeping edits saved after the page was opened', async () => {
    const data = createDataLayer('localStorage')
    const task = (await data.maintenance.getById('maintenance-2'))!
    // Another tab renames the task after this page loaded it.
    await data.maintenance.update({ ...task, title: 'Renamed elsewhere' })

    const started = await changeMaintenanceStatus(data, task.id, 'in_progress', later)

    expect(started).toEqual({
      ...task,
      title: 'Renamed elsewhere',
      status: 'in_progress',
      updatedAt: later.toISOString(),
    })
  })

  it('does not change the status of the space', async () => {
    const data = createDataLayer('localStorage')
    // maintenance-1 is in progress in space-joensuu-center-16.
    const before = await data.spaces.getById('space-joensuu-center-16')

    await changeMaintenanceStatus(data, 'maintenance-1', 'completed')

    expect(await data.spaces.getById('space-joensuu-center-16')).toEqual(before)
  })

  it('rejects a status outside the domain union', async () => {
    const data = createDataLayer('localStorage')
    await expect(
      changeMaintenanceStatus(data, 'maintenance-3', 'done' as never),
    ).rejects.toBeInstanceOf(MaintenanceValidationError)
  })

  it('deletes a task', async () => {
    const data = createDataLayer('localStorage')
    await deleteMaintenance(data, 'maintenance-3')
    expect(await data.maintenance.getById('maintenance-3')).toBeNull()
  })

  it('finds a task with its property and space', async () => {
    const maintenanceData = await loadMaintenanceData(createDataLayer('localStorage'))

    expect(getMaintenanceDetails(maintenanceData, 'maintenance-2')).toMatchObject({
      task: { title: 'Grease trap service' },
      property: { name: 'Joensuu Center' },
      space: { name: 'Retail 1' },
    })
    expect(getMaintenanceDetails(maintenanceData, 'maintenance-3')?.space).toBeNull()
    expect(getMaintenanceDetails(maintenanceData, 'missing')).toBeNull()
  })
})
