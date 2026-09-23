import { beforeEach, describe, expect, it } from 'vitest'
import { createDataLayer } from '../repositories'
import { LocalStorageDemoDataStore } from '../repositories/localStorage/LocalStorageDemoDataStore'
import { EntityNotFoundError } from '../repositories/Repository'
import { initializeDemoData } from './demoDataService'
import { createSpace, deleteSpace, SpaceDeletionBlockedError, updateSpace } from './spaceService'
import type { SpaceFormValues } from './spaces'

const values: SpaceFormValues = {
  propertyId: 'property-joensuu-center',
  name: 'A 501',
  type: 'office',
  floor: '5',
  area: '62,5',
  rooms: '3',
  features: ['parking', 'kitchen'],
  status: 'maintenance',
}

describe('space service', () => {
  beforeEach(async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
  })

  it('creates a space that survives a page refresh', async () => {
    const created = await createSpace(createDataLayer('localStorage'), values)

    const reloaded = await createDataLayer('localStorage').spaces.getById(created.id)
    expect(reloaded).toEqual(created)
    expect(reloaded).toMatchObject({ areaM2: 62.5, status: 'maintenance' })
  })

  it('keeps a space with an active lease occupied', async () => {
    const data = createDataLayer('localStorage')
    // space-joensuu-center-6 (A 202) has an active lease in the seed data.
    const updated = await updateSpace(data, 'space-joensuu-center-6', {
      ...values,
      name: 'A 202',
      status: 'available',
    })
    expect(updated.status).toBe('occupied')
  })

  it('lets a space without an active lease switch to maintenance', async () => {
    const data = createDataLayer('localStorage')
    // space-joensuu-center-5 (A 201) is available; its only lease has ended.
    const updated = await updateSpace(data, 'space-joensuu-center-5', {
      ...values,
      name: 'A 201',
      status: 'maintenance',
    })
    expect(updated.status).toBe('maintenance')
  })

  it('rejects updating a missing space', async () => {
    await expect(
      updateSpace(createDataLayer('localStorage'), 'missing', values),
    ).rejects.toBeInstanceOf(EntityNotFoundError)
  })

  it('rejects duplicate names when creating or editing against current data', async () => {
    const data = createDataLayer('localStorage')
    const created = await createSpace(data, values)
    await expect(createSpace(data, { ...values, name: ' a 501 ' })).rejects.toMatchObject({
      errors: { name: 'duplicate' },
    })
    await expect(updateSpace(data, created.id, { ...values, name: 'A 201' })).rejects.toMatchObject({
      errors: { name: 'duplicate' },
    })
    expect((await data.spaces.getById(created.id))?.name).toBe('A 501')
  })

  it('rejects missing properties and invalid numbers before persisting', async () => {
    const data = createDataLayer('localStorage')
    await expect(createSpace(data, { ...values, propertyId: 'missing' })).rejects.toMatchObject({
      errors: { propertyId: 'notFound' },
    })
    await expect(createSpace(data, { ...values, floor: '2.5', area: '0' })).rejects.toMatchObject({
      errors: { floor: 'invalid', area: 'invalid' },
    })
    expect(await data.spaces.getAll()).toHaveLength(68)
  })

  it('allows editing a space without changing its unique name', async () => {
    const data = createDataLayer('localStorage')
    const created = await createSpace(data, values)
    const updated = await updateSpace(data, created.id, { ...values, area: '75' })
    expect(updated).toMatchObject({ name: 'A 501', areaM2: 75 })
  })

  it('preserves the property of a space referenced by maintenance tasks', async () => {
    const data = createDataLayer('localStorage')
    const id = 'space-joensuu-center-16'
    await expect(updateSpace(data, id, {
      ...values, propertyId: 'property-kuopio-harbour',
    })).rejects.toMatchObject({ errors: { propertyId: 'maintenanceLinked' } })
    expect((await data.spaces.getById(id))?.propertyId).toBe('property-joensuu-center')

    // Other edits still work, and a space without maintenance can move.
    await expect(updateSpace(data, id, values)).resolves.toMatchObject({ name: 'A 501' })
    const created = await createSpace(data, { ...values, name: 'A 502' })
    await expect(updateSpace(data, created.id, {
      ...values, propertyId: 'property-kuopio-harbour',
    })).resolves.toMatchObject({ propertyId: 'property-kuopio-harbour' })
  })

  it('refuses to delete a space that has a lease', async () => {
    const data = createDataLayer('localStorage')
    const error = await deleteSpace(data, 'space-joensuu-center-6').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(SpaceDeletionBlockedError)
    expect(await data.spaces.getById('space-joensuu-center-6')).not.toBeNull()
  })

  it('deletes a space nothing refers to', async () => {
    const data = createDataLayer('localStorage')
    const created = await createSpace(data, values)

    await deleteSpace(data, created.id)

    expect(await data.spaces.getById(created.id)).toBeNull()
  })
})
