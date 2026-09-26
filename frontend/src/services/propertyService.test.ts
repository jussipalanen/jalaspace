import { beforeEach, describe, expect, it } from 'vitest'
import { createDataLayer } from '../repositories'
import { LocalStorageDemoDataStore } from '../repositories/localStorage/LocalStorageDemoDataStore'
import { EntityNotFoundError } from '../repositories/Repository'
import { initializeDemoData } from './demoDataService'
import {
  createProperty,
  deleteProperty,
  loadPropertyDetails,
  PropertyDeletionBlockedError,
  updateProperty,
} from './propertyService'
import type { PropertyFormValues } from './properties'

const values: PropertyFormValues = {
  name: 'Oulu Tech Campus',
  type: 'office',
  address: 'Kauppurienkatu 3',
  postalCode: '90100',
  city: 'Oulu',
  description: 'Offices near the university.',
  latitude: '',
  longitude: '',
  zoom: 16,
}

describe('property service', () => {
  beforeEach(async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
  })

  it('creates a property that survives a page refresh', async () => {
    const created = await createProperty(createDataLayer('localStorage'), values)

    // A new data layer reads localStorage again, like after a reload.
    const reloaded = await createDataLayer('localStorage').properties.getAll()
    expect(reloaded).toHaveLength(5)
    expect(reloaded).toContainEqual(created)
  })

  it('updates a property and keeps its creation time', async () => {
    const data = createDataLayer('localStorage')
    const created = await createProperty(data, values, new Date('2026-01-01T00:00:00.000Z'))

    const updated = await updateProperty(
      data,
      created.id,
      { ...values, name: 'Oulu Tech Campus B' },
      new Date('2026-09-22T10:30:00.000Z'),
    )

    expect(updated.name).toBe('Oulu Tech Campus B')
    expect(updated.createdAt).toBe('2026-01-01T00:00:00.000Z')
    expect(updated.updatedAt).toBe('2026-09-22T10:30:00.000Z')
    expect(await data.properties.getById(created.id)).toEqual(updated)
  })

  it('rejects updating a property that does not exist', async () => {
    await expect(
      updateProperty(createDataLayer('localStorage'), 'missing', values),
    ).rejects.toBeInstanceOf(EntityNotFoundError)
  })

  it('refuses to delete a property that still has spaces', async () => {
    const data = createDataLayer('localStorage')

    const error = await deleteProperty(data, 'property-joensuu-center').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(PropertyDeletionBlockedError)
    expect((error as PropertyDeletionBlockedError).check).toMatchObject({ spaceCount: 22 })
    expect(await data.properties.getById('property-joensuu-center')).not.toBeNull()
  })

  it('deletes a property that nothing refers to', async () => {
    const data = createDataLayer('localStorage')
    const created = await createProperty(data, values)

    await deleteProperty(data, created.id)

    expect(await data.properties.getById(created.id)).toBeNull()
    expect(await data.properties.getAll()).toHaveLength(4)
  })

  it('loads details with spaces, open maintenance and the delete check', async () => {
    const details = await loadPropertyDetails(createDataLayer('localStorage'), 'property-joensuu-center')

    expect(details?.spaces).toHaveLength(22)
    expect(details?.metrics.occupancyPercent).toBe(86)
    expect(details?.openMaintenance.map((task) => task.status)).not.toContain('completed')
    expect(details?.deletion.allowed).toBe(false)
  })

  it('returns null for an unknown property', async () => {
    expect(await loadPropertyDetails(createDataLayer('localStorage'), 'missing')).toBeNull()
  })
})
