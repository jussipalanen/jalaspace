import { beforeEach, describe, expect, it } from 'vitest'
import { createDataLayer, type DataLayer } from '../repositories'
import { ApiRequestError } from '../repositories/api/apiRequest'
import { LocalStorageDemoDataStore } from '../repositories/localStorage/LocalStorageDemoDataStore'
import { EntityNotFoundError } from '../repositories/Repository'
import type { ApplicationFormValues } from './applications'
import {
  ApplicationStatusChangeError,
  ApplicationValidationError,
  approveApplication,
  changeApplicationStatus,
  createApplication,
  deleteApplication,
  getApplicationDetails,
  loadApplicationData,
  leaseFormPath,
  loadOpenSpaces,
  rejectApplications,
  SpaceUnavailableError,
} from './applicationService'
import { initializeDemoData } from './demoDataService'
import { deleteSpace, SpaceDeletionBlockedError } from './spaceService'
import { deleteTenant, TenantDeletionBlockedError } from './tenantService'

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

  describe('approving', () => {
    it('creates a tenant from the applicant and links the approved application to it', async () => {
      const data = createDataLayer('localStorage')
      const tenantsBefore = (await data.tenants.getAll()).length

      const result = await approveApplication(data, 'application-6', now)

      expect(result.tenantCreated).toBe(true)
      expect(result.tenant).toMatchObject({
        type: 'company',
        name: 'Consulting Esimerkki Oy',
        contactPerson: 'Tapio Esimerkki',
        email: 'info@consulting-esimerkki.example',
        phone: '+358501234564',
        notes: '',
      })
      expect(result.application).toMatchObject({
        status: 'approved',
        tenantId: result.tenant.id,
        decidedAt: now.toISOString(),
      })
      expect(await data.tenants.getAll()).toHaveLength(tenantsBefore + 1)
      // No lease is created: the manager saves it in the lease form.
      expect((await data.leases.getAll()).some((lease) => lease.tenantId === result.tenant.id)).toBe(false)
    })

    it('reuses the tenant with the same email, ignoring case, without changing it', async () => {
      const data = createDataLayer('localStorage')
      const application = (await data.applications.getById('application-5'))!
      await data.applications.update({ ...application, email: 'INFO@nordic-pixel.example' })
      const tenantBefore = await data.tenants.getById('tenant-nordic-pixel')

      const result = await approveApplication(data, 'application-5', now)

      expect(result.tenantCreated).toBe(false)
      expect(result.application.tenantId).toBe('tenant-nordic-pixel')
      expect(await data.tenants.getById('tenant-nordic-pixel')).toEqual(tenantBefore)
    })

    it('does not create a second tenant when approving again after saving the application failed', async () => {
      const data = createDataLayer('localStorage')
      const { applications } = data
      const failing = {
        ...data,
        applications: {
          getAll: () => applications.getAll(),
          getById: (id: string) => applications.getById(id),
          create: applications.create.bind(applications),
          delete: (id: string) => applications.delete(id),
          update: () => Promise.reject(new Error('storage full')),
        },
      }
      await expect(approveApplication(failing, 'application-6', now)).rejects.toThrow('storage full')
      const tenantsAfterFailure = await data.tenants.getAll()

      const result = await approveApplication(data, 'application-6', now)

      expect(result.tenantCreated).toBe(false)
      expect(await data.tenants.getAll()).toEqual(tenantsAfterFailure)
      expect(result.application.status).toBe('approved')
    })

    it('refuses decided applications and spaces that cannot be applied for any more', async () => {
      const data = createDataLayer('localStorage')
      await expect(approveApplication(data, 'application-1', now)).rejects.toBeInstanceOf(
        ApplicationStatusChangeError,
      )

      const space = (await data.spaces.getById('space-helsinki-kallio-11'))!
      await data.spaces.update({ ...space, status: 'maintenance' })
      await expect(approveApplication(data, 'application-7', now)).rejects.toBeInstanceOf(SpaceUnavailableError)
      expect(await data.applications.getById('application-7')).toMatchObject({ status: 'submitted' })
    })

    it('shows the other open applications for the space and rejects them together', async () => {
      const data = createDataLayer('localStorage')
      await approveApplication(data, 'application-4', now)
      const details = getApplicationDetails(await loadApplicationData(data), 'application-4', today)!
      expect(details.otherOpen.map((other) => other.id)).toEqual(['application-7'])
      expect(details.tenant?.name).toBe('Oskari Esimerkki')
      expect(details.hasLease).toBe(false)

      // One of them was decided meanwhile: it is skipped, not rejected twice.
      await changeApplicationStatus(data, 'application-3', 'withdrawn', now)
      expect(await rejectApplications(data, ['application-7', 'application-3'], now)).toBe(1)
      expect(await data.applications.getById('application-7')).toMatchObject({ status: 'rejected' })
      expect(await data.applications.getById('application-3')).toMatchObject({ status: 'withdrawn' })
    })

    it('links to the lease form with the tenant, space and desired start filled in', () => {
      expect(
        leaseFormPath({ id: 'application-4', tenantId: 'tenant-x', spaceId: 'space-1', desiredStartDate: '2026-10-19' }),
      ).toBe('/leases/new?tenant=tenant-x&space=space-1&startDate=2026-10-19&returnTo=%2Fapplications%2Fapplication-4')
    })

    it('keeps a tenant that an approved application refers to', async () => {
      const data = createDataLayer('localStorage')
      const { tenant } = await approveApplication(data, 'application-6', now)

      const error = await deleteTenant(data, tenant.id).catch((e: unknown) => e)

      expect(error).toBeInstanceOf(TenantDeletionBlockedError)
      expect(error).toMatchObject({ check: { leaseCount: 0, applicationCount: 1 } })
    })
  })
})
