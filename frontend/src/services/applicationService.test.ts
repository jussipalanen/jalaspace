import { beforeEach, describe, expect, it } from 'vitest'
import { createDataLayer } from '../repositories'
import { LocalStorageDemoDataStore } from '../repositories/localStorage/LocalStorageDemoDataStore'
import { EntityNotFoundError } from '../repositories/Repository'
import {
  ApplicationStatusChangeError,
  changeApplicationStatus,
  deleteApplication,
  getApplicationDetails,
  loadApplicationData,
} from './applicationService'
import { initializeDemoData } from './demoDataService'
import { deleteSpace, SpaceDeletionBlockedError } from './spaceService'

const now = new Date('2026-09-25T08:00:00.000Z')
const today = '2026-09-25'

describe('application service', () => {
  beforeEach(async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
  })

  it('moves an application to review, then rejects it, and the change survives a reload', async () => {
    const data = createDataLayer('localStorage')

    await changeApplicationStatus(data, 'application-7', 'in_review', now)
    const rejected = await changeApplicationStatus(data, 'application-7', 'rejected', now)

    expect(rejected).toMatchObject({ status: 'rejected', decidedAt: now.toISOString() })
    expect(await createDataLayer('localStorage').applications.getById('application-7')).toEqual(rejected)
  })

  it('refuses status changes the rules do not allow, checked with the stored application', async () => {
    const data = createDataLayer('localStorage')

    const error = await changeApplicationStatus(data, 'application-1', 'in_review', now).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApplicationStatusChangeError)
    expect(error).toMatchObject({ from: 'rejected', to: 'in_review' })
    await expect(changeApplicationStatus(data, 'missing', 'rejected', now)).rejects.toBeInstanceOf(
      EntityNotFoundError,
    )
  })

  it('shows an application with its space and flags an open one whose space was let meanwhile', async () => {
    const data = createDataLayer('localStorage')
    const loaded = await loadApplicationData(data)

    expect(getApplicationDetails(loaded, 'application-7', today)).toMatchObject({
      space: { name: 'A 11' },
      property: { name: 'Helsinki Kallio Residences' },
      spaceUnavailable: false,
    })
    // A decided application keeps its history without a warning.
    expect(getApplicationDetails(loaded, 'application-1', today)?.spaceUnavailable).toBe(false)
    expect(getApplicationDetails(loaded, 'missing', today)).toBeNull()

    const afterLetting = {
      ...loaded,
      spaces: loaded.spaces.map((item) =>
        item.id === 'space-helsinki-kallio-11' ? { ...item, status: 'occupied' as const } : item,
      ),
    }
    expect(getApplicationDetails(afterLetting, 'application-7', today)?.spaceUnavailable).toBe(true)
  })

  it('deletes an application', async () => {
    const data = createDataLayer('localStorage')

    await deleteApplication(data, 'application-5')

    expect(await data.applications.getById('application-5')).toBeNull()
  })

  it('keeps a space that applications refer to', async () => {
    const data = createDataLayer('localStorage')

    const error = await deleteSpace(data, 'space-kuopio-harbour-17').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(SpaceDeletionBlockedError)
    expect(error).toMatchObject({ check: { applicationCount: 1, leaseCount: 0, maintenanceCount: 0 } })

    await deleteApplication(data, 'application-5')
    await deleteSpace(data, 'space-kuopio-harbour-17')
    expect(await data.spaces.getById('space-kuopio-harbour-17')).toBeNull()
  })
})
