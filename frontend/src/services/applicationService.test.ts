import { beforeEach, describe, expect, it } from 'vitest'
import { createDataLayer, type DataLayer } from '../repositories'
import { ApiRequestError } from '../repositories/api/apiRequest'
import { LocalStorageDemoDataStore } from '../repositories/localStorage/LocalStorageDemoDataStore'
import { EntityNotFoundError } from '../repositories/Repository'
import type { ApplicationFormValues } from './applications'
import {
  ApplicationStatusChangeError,
  ApplicationValidationError,
  changeApplicationStatus,
  createApplication,
  deleteApplication,
  getApplicationDetails,
  loadApplicationData,
  loadOpenSpaces,
  SpaceUnavailableError,
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

  describe('sending a new application', () => {
    const values: ApplicationFormValues = {
      applicantType: 'company',
      name: 'Bakery Esimerkki Oy',
      contactPerson: 'Liisa Esimerkki',
      email: 'info@bakery-esimerkki.example',
      phone: '+358501234566',
      desiredStartDate: '1.11.2026',
      message: 'A small bakery with a café.',
    }

    it('lists the spaces that can be applied for', async () => {
      const open = await loadOpenSpaces(createDataLayer('localStorage'), 'en-GB', now)
      expect(open.map(({ space }) => space.id)).toContain('space-kuopio-harbour-3')
      expect(open.map(({ space }) => space.id)).not.toContain('space-joensuu-center-12')
    })

    it('saves a submitted application that the manager sees after a reload', async () => {
      const created = await createApplication(createDataLayer('localStorage'), 'space-kuopio-harbour-3', values, now)

      expect(created).toMatchObject({
        spaceId: 'space-kuopio-harbour-3',
        status: 'submitted',
        desiredStartDate: '2026-11-01',
        createdAt: now.toISOString(),
      })
      const loaded = await loadApplicationData(createDataLayer('localStorage'))
      expect(loaded.applications).toContainEqual(created)
    })

    it('refuses invalid values, a past start and a second open application from the same email', async () => {
      const data = createDataLayer('localStorage')

      const past = await createApplication(data, 'space-kuopio-harbour-3', { ...values, desiredStartDate: '1.9.2026' }, now).catch(
        (e: unknown) => e,
      )
      expect(past).toBeInstanceOf(ApplicationValidationError)
      expect(past).toMatchObject({ errors: { desiredStartDate: 'past' } })

      await createApplication(data, 'space-kuopio-harbour-3', values, now)
      await expect(createApplication(data, 'space-kuopio-harbour-3', values, now)).rejects.toMatchObject({
        errors: { email: 'duplicate' },
      })
    })

    it('refuses spaces that are reserved, let or missing', async () => {
      const data = createDataLayer('localStorage')
      for (const spaceId of ['space-joensuu-center-12', 'space-joensuu-center-1', 'missing']) {
        await expect(createApplication(data, spaceId, values, now)).rejects.toBeInstanceOf(SpaceUnavailableError)
      }
    })

    it('maps the API refusing the space or a field to the same errors', async () => {
      const failingWith = (error: ApiRequestError): DataLayer => {
        const data = createDataLayer('localStorage')
        return { ...data, applications: { ...data.applications, getAll: () => data.applications.getAll(), create: () => Promise.reject(error) } }
      }

      await expect(
        createApplication(failingWith(new ApiRequestError(409, 'space_unavailable')), 'space-kuopio-harbour-3', values, now),
      ).rejects.toBeInstanceOf(SpaceUnavailableError)
      await expect(
        createApplication(
          failingWith(new ApiRequestError(400, 'validation_failed', { fields: { email: 'duplicate' } })),
          'space-kuopio-harbour-3',
          values,
          now,
        ),
      ).rejects.toMatchObject({ errors: { email: 'duplicate' } })
    })
  })
})
