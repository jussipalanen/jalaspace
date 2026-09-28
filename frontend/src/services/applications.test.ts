import { describe, expect, it } from 'vitest'
import { createSeedData } from '../data/seed'
import type { Application } from '../types/application'
import type { Lease } from '../types/lease'
import {
  applyApplicationStatus,
  buildApplicationRows,
  buildNewApplication,
  filterOpenSpaces,
  listOpenSpaces,
  canChangeApplicationStatus,
  countNewApplications,
  filterApplicationRows,
  isSpaceOpenForApplications,
  newApplicationsBadge,
  toApplicationForm,
  validateApplicationForm,
  type ApplicationFormValues,
} from './applications'

const seed = createSeedData(new Date('2026-09-22T10:30:00.000Z'))
const now = '2026-09-25T08:00:00.000Z'

const values: ApplicationFormValues = {
  applicantType: 'person',
  name: 'Lotta Esimerkki',
  contactPerson: '',
  email: 'lotta.esimerkki@example.com',
  phone: '+358501234565',
  desiredStartDate: '1.11.2026',
  message: '',
}

const application = (overrides: Partial<Application> = {}): Application => ({
  id: 'application-x',
  spaceId: 'space-1',
  ...values,
  desiredStartDate: '2026-11-01',
  contactPerson: null,
  phone: null,
  status: 'submitted',
  decidedAt: null,
  tenantId: null,
  createdAt: '2026-09-20T08:00:00.000Z',
  updatedAt: '2026-09-20T08:00:00.000Z',
  ...overrides,
})

describe('application status', () => {
  it('moves forward from submitted and in review, and never leaves a final status', () => {
    expect(canChangeApplicationStatus('submitted', 'in_review')).toBe(true)
    expect(canChangeApplicationStatus('in_review', 'rejected')).toBe(true)
    expect(canChangeApplicationStatus('in_review', 'submitted')).toBe(false)
    expect(canChangeApplicationStatus('rejected', 'in_review')).toBe(false)
    expect(canChangeApplicationStatus('withdrawn', 'withdrawn')).toBe(false)
  })

  it('sets decidedAt only when a decision is made', () => {
    expect(applyApplicationStatus(application(), 'in_review', now)).toMatchObject({
      status: 'in_review',
      decidedAt: null,
      updatedAt: now,
    })
    expect(applyApplicationStatus(application({ status: 'in_review' }), 'rejected', now)).toMatchObject({
      status: 'rejected',
      decidedAt: now,
    })
  })
})

describe('spaces open for applications', () => {
  const lease = (overrides: Partial<Lease>): Lease => ({
    id: 'lease-x',
    tenantId: 'tenant-1',
    spaceId: 'space-1',
    startDate: '2020-01-01',
    endDate: '2021-12-31',
    monthlyRentCents: null,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    ...overrides,
  })
  const today = '2026-09-22'

  it('are available and not reserved by an upcoming lease', () => {
    const space = { id: 'space-1', status: 'available' as const }
    expect(isSpaceOpenForApplications(space, [lease({})], today)).toBe(true)
    expect(isSpaceOpenForApplications(space, [lease({ startDate: '2026-10-01', endDate: null })], today)).toBe(false)
    expect(isSpaceOpenForApplications({ ...space, status: 'occupied' }, [], today)).toBe(false)
    expect(isSpaceOpenForApplications({ ...space, status: 'maintenance' }, [], today)).toBe(false)
  })

  it('include A 11 in Kallio but not A 302 in Joensuu, which is reserved', () => {
    const byId = (id: string) => seed.spaces.find((space) => space.id === id)!
    expect(isSpaceOpenForApplications(byId('space-helsinki-kallio-11'), seed.leases, today)).toBe(true)
    expect(isSpaceOpenForApplications(byId('space-joensuu-center-12'), seed.leases, today)).toBe(false)
  })
})

describe('application form validation', () => {
  it('accepts a valid application and the same email twice', () => {
    expect(validateApplicationForm(values)).toEqual({})
    expect(validateApplicationForm(toApplicationForm(application()))).toEqual({})
  })

  it('returns an error code per invalid field', () => {
    expect(
      validateApplicationForm({
        applicantType: 'company',
        name: ' ',
        contactPerson: 'x'.repeat(101),
        email: 'lotta@',
        phone: 'call me',
        desiredStartDate: '30.2.2026',
        message: 'x'.repeat(2001),
      }),
    ).toEqual({
      name: 'required',
      contactPerson: 'tooLong',
      email: 'invalid',
      phone: 'invalid',
      desiredStartDate: 'invalid',
      message: 'tooLong',
    })
    expect(validateApplicationForm({ ...values, email: '', desiredStartDate: '' })).toEqual({
      email: 'required',
      desiredStartDate: 'required',
    })
  })
})

describe('new applications', () => {
  const context = { spaceId: 'space-1', today: '2026-09-22', applications: [] }

  it('start today or later', () => {
    expect(validateApplicationForm({ ...values, desiredStartDate: '22.9.2026' }, context)).toEqual({})
    expect(validateApplicationForm({ ...values, desiredStartDate: '21.9.2026' }, context)).toEqual({
      desiredStartDate: 'past',
    })
    // Without the context, e.g. for stored applications, the date is only checked for its format.
    expect(validateApplicationForm({ ...values, desiredStartDate: '21.9.2026' })).toEqual({})
  })

  it('allow one open application per email and space, ignoring case', () => {
    const open = application({ email: 'LOTTA.esimerkki@example.com', status: 'in_review' })
    expect(validateApplicationForm(values, { ...context, applications: [open] })).toEqual({ email: 'duplicate' })
    expect(
      validateApplicationForm(values, { ...context, applications: [{ ...open, status: 'rejected' }] }),
    ).toEqual({})
    expect(validateApplicationForm(values, { ...context, applications: [{ ...open, spaceId: 'space-2' }] })).toEqual(
      {},
    )
  })

  it('are built from trimmed form values, submitted and without a tenant', () => {
    expect(
      buildNewApplication(
        { ...values, name: ' Lotta Esimerkki ', contactPerson: 'ignored for a person', phone: ' ', message: ' Hi ' },
        'space-1',
        now,
        'application-new',
      ),
    ).toEqual({
      id: 'application-new',
      spaceId: 'space-1',
      applicantType: 'person',
      name: 'Lotta Esimerkki',
      contactPerson: null,
      email: 'lotta.esimerkki@example.com',
      phone: null,
      desiredStartDate: '2026-11-01',
      message: 'Hi',
      status: 'submitted',
      decidedAt: null,
      tenantId: null,
      createdAt: now,
      updatedAt: now,
    })
  })
})

describe('open spaces', () => {
  const open = listOpenSpaces(seed.spaces, seed.properties, seed.leases, '2026-09-22', 'en-GB')

  it('list the available spaces without the reserved one, by city, property and name', () => {
    expect(open.map(({ space, property }) => `${property.city}: ${space.name}`)).toEqual([
      'Helsinki: A 11',
      'Joensuu: A 201',
      'Kuopio: B 103',
      'Kuopio: B 204',
      'Kuopio: B 305',
      'Tampere: Storage 2',
    ])
  })

  it('filter by city and space type', () => {
    expect(filterOpenSpaces(open, { city: 'Kuopio', type: '' })).toHaveLength(3)
    expect(filterOpenSpaces(open, { city: '', type: 'storage' }).map(({ space }) => space.name)).toEqual([
      'Storage 2',
    ])
    expect(filterOpenSpaces(open, { city: 'Helsinki', type: 'office' })).toEqual([])
  })
})

describe('application rows', () => {
  const rows = buildApplicationRows(seed.applications, seed.spaces, seed.properties)

  it('joins the space and property, newest first', () => {
    expect(rows.map((row) => row.application.name).slice(0, 2)).toEqual([
      'Consulting Esimerkki Oy',
      'Lotta Esimerkki',
    ])
    expect(rows.at(-1)?.application.name).toBe('Pilates Studio Esimerkki Oy')
    const lotta = rows.find((row) => row.application.name === 'Lotta Esimerkki')!
    expect(lotta.space?.name).toBe('A 11')
    expect(lotta.property?.name).toBe('Helsinki Kallio Residences')
  })

  it('filters by status, open applications, property and search text', () => {
    const names = (filters: Parameters<typeof filterApplicationRows>[1]) =>
      filterApplicationRows(rows, filters, 'en-GB').map((row) => row.application.name)

    expect(names({ status: 'open', propertyId: '', query: '' })).toHaveLength(5)
    expect(names({ status: 'rejected', propertyId: '', query: '' })).toEqual(['Pilates Studio Esimerkki Oy'])
    expect(names({ status: '', propertyId: 'property-helsinki-kallio', query: '' })).toEqual([
      'Lotta Esimerkki',
      'Oskari Esimerkki',
    ])
    expect(names({ status: '', propertyId: '', query: 'TAPIO' })).toEqual(['Consulting Esimerkki Oy'])
    expect(names({ status: '', propertyId: '', query: 'pilates-studio-esimerkki.example' })).toEqual(['Pilates Studio Esimerkki Oy'])
  })
})

describe('new applications badge', () => {
  it('counts only submitted applications', () => {
    expect(countNewApplications(seed.applications)).toBe(3)
    expect(countNewApplications([])).toBe(0)
  })

  it('is hidden at zero, shows the number up to 100 and +100 above that', () => {
    expect(newApplicationsBadge(0)).toBeNull()
    expect(newApplicationsBadge(3)).toBe('3')
    expect(newApplicationsBadge(100)).toBe('100')
    expect(newApplicationsBadge(101)).toBe('+100')
    expect(newApplicationsBadge(5000)).toBe('+100')
  })
})
