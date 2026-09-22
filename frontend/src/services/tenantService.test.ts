import { beforeEach, describe, expect, it } from 'vitest'
import { createDataLayer } from '../repositories'
import { LocalStorageDemoDataStore } from '../repositories/localStorage/LocalStorageDemoDataStore'
import { EntityNotFoundError } from '../repositories/Repository'
import { addDays, toIsoDate } from '../utils/date'
import { formatDate } from '../utils/format'
import { initializeDemoData } from './demoDataService'
import { findActiveLease } from './spaces'
import { createLease, LeaseValidationError } from './leaseService'
import type { LeaseFormValues } from './leases'
import {
  createTenant,
  deleteTenant,
  getTenantDetails,
  loadTenantData,
  removeTenantFromSpace,
  TenantDeletionBlockedError,
  TenantValidationError,
  updateTenant,
} from './tenantService'
import type { TenantFormValues } from './tenants'

const values: TenantFormValues = {
  type: 'company',
  name: 'Pohjola Bakery Oy',
  contactPerson: 'Liisa Pohjola',
  email: 'hello@pohjola-bakery.example',
  phone: '',
  notes: '',
}
const today = () => toIsoDate(new Date())
// B 204 in Kuopio Harbour is available and has never been leased.
const assignment = (startDate = formatDate(today())): Omit<LeaseFormValues, 'tenantId'> => ({
  propertyId: 'property-kuopio-harbour',
  spaceId: 'space-kuopio-harbour-10',
  startDate,
  endDate: '',
  monthlyRent: '980',
})
const assignTenantToSpace = async (
  data: ReturnType<typeof createDataLayer>,
  tenantId: string,
  values: Omit<LeaseFormValues, 'tenantId'>,
) => {
  const lease = await createLease(data, { ...values, tenantId })
  return { lease, space: (await data.spaces.getById(lease.spaceId))! }
}

describe('tenant service', () => {
  beforeEach(async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
  })

  it('creates a tenant that survives a page refresh', async () => {
    const created = await createTenant(createDataLayer('localStorage'), values)

    const reloaded = await createDataLayer('localStorage').tenants.getById(created.id)
    expect(reloaded).toEqual(created)
  })

  it('rejects invalid values and duplicate emails against current data', async () => {
    const data = createDataLayer('localStorage')
    await expect(createTenant(data, { ...values, name: '' })).rejects.toBeInstanceOf(
      TenantValidationError,
    )
    await expect(
      createTenant(data, { ...values, email: 'INFO@nordic-pixel.example' }),
    ).rejects.toMatchObject({ errors: { email: 'duplicate' } })
    expect(await data.tenants.getAll()).toHaveLength(31)
  })

  it('updates a tenant and allows keeping its own email', async () => {
    const data = createDataLayer('localStorage')
    const updated = await updateTenant(data, 'tenant-nordic-pixel', {
      ...values,
      name: 'Nordic Pixel Group Oy',
      email: 'info@nordic-pixel.example',
    })
    expect(updated).toMatchObject({ id: 'tenant-nordic-pixel', name: 'Nordic Pixel Group Oy' })
    await expect(updateTenant(data, 'missing', values)).rejects.toBeInstanceOf(EntityNotFoundError)
  })

  it('refuses to delete a tenant with leases and deletes one without', async () => {
    const data = createDataLayer('localStorage')
    const error = await deleteTenant(data, 'tenant-old-town-books').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(TenantDeletionBlockedError)
    expect(await data.tenants.getById('tenant-old-town-books')).not.toBeNull()

    const created = await createTenant(data, values)
    await deleteTenant(data, created.id)
    expect(await data.tenants.getById(created.id)).toBeNull()
  })

  it('assigns a tenant from today: an open-ended lease that occupies the space', async () => {
    const data = createDataLayer('localStorage')
    const { lease, space } = await assignTenantToSpace(data, 'tenant-aino-virtanen', assignment())

    expect(lease).toMatchObject({
      tenantId: 'tenant-aino-virtanen',
      spaceId: 'space-kuopio-harbour-10',
      startDate: today(),
      endDate: null,
      monthlyRentCents: 98000,
    })
    expect(space.status).toBe('occupied')
    expect(await data.spaces.getById('space-kuopio-harbour-10')).toMatchObject({ status: 'occupied' })
    const details = getTenantDetails(await loadTenantData(data), 'tenant-aino-virtanen', today())
    expect(details?.leases.current.map((entry) => entry.space?.name)).toContain('B 204')
  })

  it('reserves a space for a future start without occupying it', async () => {
    const data = createDataLayer('localStorage')
    const start = toIsoDate(addDays(new Date(), 30))
    const { lease, space } = await assignTenantToSpace(
      data,
      'tenant-aino-virtanen',
      assignment(formatDate(start)),
    )
    expect(lease.startDate).toBe(start)
    expect(space.status).toBe('available')
  })

  it('rejects assigning to an occupied space or over a later lease', async () => {
    const data = createDataLayer('localStorage')
    const before = await data.leases.getAll()
    await expect(
      assignTenantToSpace(data, 'tenant-aino-virtanen', {
        ...assignment(),
        propertyId: 'property-joensuu-center',
        spaceId: 'space-joensuu-center-6',
      }),
    ).rejects.toMatchObject({ errors: { spaceId: 'overlap' } })
    // A 302 is reserved for Aurora Yoga later this year.
    const error = await assignTenantToSpace(data, 'tenant-aino-virtanen', {
      ...assignment(),
      propertyId: 'property-joensuu-center',
      spaceId: 'space-joensuu-center-12',
    }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(LeaseValidationError)
    expect(error).toMatchObject({ errors: { spaceId: 'overlap' } })
    expect(await data.leases.getAll()).toHaveLength(before.length)
  })

  it('rejects a second assignment of the same space from a stale form', async () => {
    const data = createDataLayer('localStorage')
    await assignTenantToSpace(data, 'tenant-aino-virtanen', assignment())
    await expect(
      assignTenantToSpace(data, 'tenant-mikko-korhonen', assignment()),
    ).rejects.toMatchObject({ errors: { spaceId: 'overlap' } })
  })

  it('removes a tenant who has moved in earlier: the lease ends yesterday and the space is freed', async () => {
    const data = createDataLayer('localStorage')
    // Aino Virtanen rents A 1 in Helsinki under lease-45.
    const { action } = await removeTenantFromSpace(data, 'lease-45')

    expect(action).toBe('end')
    const lease = await data.leases.getById('lease-45')
    expect(lease?.endDate).toBe(toIsoDate(addDays(new Date(), -1)))
    expect(await data.spaces.getById('space-helsinki-kallio-1')).toMatchObject({ status: 'available' })
    expect(findActiveLease('space-helsinki-kallio-1', await data.leases.getAll(), today())).toBeNull()
  })

  it('cancels a lease that has not started, removing it', async () => {
    const data = createDataLayer('localStorage')
    // Aurora Yoga's lease of A 302 starts later this year.
    const { action } = await removeTenantFromSpace(data, 'lease-59')

    expect(action).toBe('cancel')
    expect(await data.leases.getById('lease-59')).toBeNull()
    expect(await data.spaces.getById('space-joensuu-center-12')).toMatchObject({ status: 'available' })
  })

  it('cancels a lease that starts today and frees the space again', async () => {
    const data = createDataLayer('localStorage')
    const { lease } = await assignTenantToSpace(data, 'tenant-aino-virtanen', assignment())

    await expect(removeTenantFromSpace(data, lease.id)).resolves.toEqual({ action: 'cancel' })
    expect(await data.spaces.getById('space-kuopio-harbour-10')).toMatchObject({ status: 'available' })
  })

  it('refuses to remove an ended or missing lease', async () => {
    const data = createDataLayer('localStorage')
    await expect(removeTenantFromSpace(data, 'lease-61')).rejects.toBeInstanceOf(EntityNotFoundError)
    await expect(removeTenantFromSpace(data, 'missing')).rejects.toBeInstanceOf(EntityNotFoundError)
  })
})
