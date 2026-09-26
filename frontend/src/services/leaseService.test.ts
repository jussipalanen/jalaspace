import { beforeEach, describe, expect, it } from 'vitest'
import { createDataLayer } from '../repositories'
import { LocalStorageDemoDataStore } from '../repositories/localStorage/LocalStorageDemoDataStore'
import { EntityNotFoundError } from '../repositories/Repository'
import { addDays, toIsoDate } from '../utils/date'
import { formatDate } from '../utils/format'
import { initializeDemoData } from './demoDataService'
import { createLease, LeaseValidationError, syncAllSpaceStatuses, updateLease } from './leaseService'
import { toLeaseForm, type LeaseFormValues } from './leases'

const day = (offset: number) => formatDate(toIsoDate(addDays(new Date(), offset)))
// B 204 in Kuopio Harbour is available and has never been leased.
const values = (overrides: Partial<LeaseFormValues> = {}): LeaseFormValues => ({
  tenantId: 'tenant-aino-esimerkki',
  propertyId: 'property-kuopio-harbour',
  spaceId: 'space-kuopio-harbour-10',
  startDate: day(0),
  endDate: '',
  monthlyRent: '980',
  ...overrides,
})

describe('lease service', () => {
  beforeEach(async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
  })

  it('creates a lease that survives a page refresh and occupies the space', async () => {
    const lease = await createLease(createDataLayer('localStorage'), values())

    const data = createDataLayer('localStorage')
    expect(await data.leases.getById(lease.id)).toEqual(lease)
    expect(await data.spaces.getById('space-kuopio-harbour-10')).toMatchObject({ status: 'occupied' })
  })

  it('leaves the space available for an upcoming lease', async () => {
    const data = createDataLayer('localStorage')
    await createLease(data, values({ startDate: day(30) }))
    expect(await data.spaces.getById('space-kuopio-harbour-10')).toMatchObject({ status: 'available' })
  })

  it('rejects overlaps and maintenance against current data', async () => {
    const data = createDataLayer('localStorage')
    await createLease(data, values())
    // The form was opened before the first lease was saved.
    const error = await createLease(data, values({ tenantId: 'tenant-mikko-esimerkki' })).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(LeaseValidationError)
    expect(error).toMatchObject({ errors: { spaceId: 'overlap' } })

    await expect(
      createLease(data, values({ propertyId: 'property-joensuu-center', spaceId: 'space-joensuu-center-16' })),
    ).rejects.toMatchObject({ errors: { spaceId: 'maintenance' } })
  })

  it('schedules a move-out: a future end date keeps the space occupied', async () => {
    const data = createDataLayer('localStorage')
    const lease45 = (await data.leases.getById('lease-45'))!
    const space = (await data.spaces.getById(lease45.spaceId))!

    const updated = await updateLease(data, 'lease-45', {
      ...toLeaseForm(lease45, space, 'fi-FI'),
      endDate: day(60),
      monthlyRent: '600',
    })

    expect(updated).toMatchObject({
      tenantId: 'tenant-aino-esimerkki',
      spaceId: 'space-helsinki-kallio-1',
      endDate: toIsoDate(addDays(new Date(), 60)),
      monthlyRentCents: 60000,
    })
    expect(await data.spaces.getById(space.id)).toMatchObject({ status: 'occupied' })
  })

  it('frees the space when an edit ends the lease in the past, and keeps tenant and space fixed', async () => {
    const data = createDataLayer('localStorage')
    const lease45 = (await data.leases.getById('lease-45'))!
    const space = (await data.spaces.getById(lease45.spaceId))!

    const updated = await updateLease(data, 'lease-45', {
      ...toLeaseForm(lease45, space, 'fi-FI'),
      tenantId: 'tenant-mikko-esimerkki',
      endDate: day(-1),
    })

    expect(updated.tenantId).toBe('tenant-aino-esimerkki')
    expect(await data.spaces.getById(space.id)).toMatchObject({ status: 'available' })
  })

  it('rejects an edit that would overlap another lease, or of a missing lease', async () => {
    const data = createDataLayer('localStorage')
    const first = await createLease(data, values({ endDate: day(10) }))
    await createLease(data, values({ tenantId: 'tenant-mikko-esimerkki', startDate: day(20) }))

    // Extending the first lease into the second one is not allowed.
    await expect(
      updateLease(data, first.id, values({ endDate: day(25) })),
    ).rejects.toMatchObject({ errors: { spaceId: 'overlap' } })
    await expect(updateLease(data, first.id, values({ endDate: day(19) }))).resolves.toMatchObject({
      endDate: toIsoDate(addDays(new Date(), 19)),
    })

    await expect(updateLease(data, 'missing', values())).rejects.toBeInstanceOf(EntityNotFoundError)
  })

  it('brings space statuses up to date on app start', async () => {
    const data = createDataLayer('localStorage')
    expect(await syncAllSpaceStatuses(data)).toBe(0)

    // Since the last visit, A 1's lease has ended.
    const lease45 = (await data.leases.getById('lease-45'))!
    await data.leases.update({ ...lease45, endDate: toIsoDate(addDays(new Date(), -1)) })
    expect(await syncAllSpaceStatuses(data)).toBe(1)
    expect(await data.spaces.getById('space-helsinki-kallio-1')).toMatchObject({ status: 'available' })

    // A reservation whose start date has now arrived occupies its space.
    const lease59 = (await data.leases.getById('lease-59'))!
    await data.leases.update({ ...lease59, startDate: toIsoDate(new Date()) })
    expect(await syncAllSpaceStatuses(data)).toBe(1)
    expect(await data.spaces.getById(lease59.spaceId)).toMatchObject({ status: 'occupied' })
  })
})
