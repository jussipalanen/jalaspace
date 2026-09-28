import { describe, expect, it } from 'vitest'
import { lease } from '../test/fixtures.ts'
import {
  canChangeApplicationStatus,
  checkApplicationReferences,
  checkNewApplication,
  isSpaceOpenForApplications,
  parseApplicationInput,
  resolveDecidedAt,
} from './applications.ts'

const valid = {
  spaceId: 'space-1',
  applicantType: 'company',
  name: '  Consulting Esimerkki Oy ',
  contactPerson: 'Tapio Esimerkki',
  email: 'info@consulting-esimerkki.example',
  phone: '+358501234564',
  desiredStartDate: '2026-11-01',
  message: 'Two consultants.',
  status: 'in_review',
  tenantId: null,
}

describe('application input', () => {
  it('accepts a valid application and trims its text', () => {
    expect(parseApplicationInput(valid)).toEqual({
      ok: true,
      values: { ...valid, name: 'Consulting Esimerkki Oy' },
    })
  })

  it('treats a missing status as a new, submitted application', () => {
    const { status: _status, ...withoutStatus } = valid
    expect(parseApplicationInput(withoutStatus)).toMatchObject({ ok: true, values: { status: 'submitted' } })
  })

  it('drops the contact person of a person and stores empty optional fields as null', () => {
    const result = parseApplicationInput({ ...valid, applicantType: 'person', phone: ' ', message: undefined })
    expect(result).toMatchObject({ ok: true, values: { contactPerson: null, phone: null, message: '' } })
  })

  it('reports an error code per invalid field', () => {
    expect(
      parseApplicationInput({
        spaceId: '',
        applicantType: 'robot',
        name: 'x'.repeat(101),
        email: 'not an email',
        phone: 'call me',
        desiredStartDate: '2026-02-30',
        message: 'x'.repeat(2001),
        status: 'lost',
        tenantId: 42,
      }),
    ).toEqual({
      ok: false,
      errors: {
        spaceId: 'required',
        applicantType: 'invalid',
        name: 'tooLong',
        email: 'invalid',
        phone: 'invalid',
        desiredStartDate: 'invalid',
        message: 'tooLong',
        status: 'invalid',
        tenantId: 'invalid',
      },
    })
    expect(parseApplicationInput(null)).toMatchObject({
      ok: false,
      errors: { name: 'required', email: 'required', desiredStartDate: 'required', applicantType: 'required' },
    })
  })

  it('requires the tenant of an approved application and ignores it otherwise', () => {
    expect(parseApplicationInput({ ...valid, status: 'approved' })).toEqual({
      ok: false,
      errors: { tenantId: 'required' },
    })
    expect(parseApplicationInput({ ...valid, status: 'approved', tenantId: 'tenant-1' })).toMatchObject({
      ok: true,
      values: { tenantId: 'tenant-1' },
    })
    expect(parseApplicationInput({ ...valid, tenantId: 'tenant-1' })).toMatchObject({
      ok: true,
      values: { tenantId: null },
    })
  })

  it('checks that the space and the tenant exist', () => {
    const input = { ...valid, status: 'approved' as const, tenantId: 'tenant-1', applicantType: 'company' as const }
    expect(checkApplicationReferences(input, { spaceExists: true, tenantExists: true })).toEqual({})
    expect(checkApplicationReferences(input, { spaceExists: false, tenantExists: false })).toEqual({
      spaceId: 'notFound',
      tenantId: 'notFound',
    })
  })
})

describe('application status', () => {
  it('moves forward from submitted and in review, and never leaves a final status', () => {
    expect(canChangeApplicationStatus('submitted', 'in_review')).toBe(true)
    expect(canChangeApplicationStatus('submitted', 'rejected')).toBe(true)
    expect(canChangeApplicationStatus('in_review', 'withdrawn')).toBe(true)
    expect(canChangeApplicationStatus('in_review', 'submitted')).toBe(false)
    expect(canChangeApplicationStatus('rejected', 'in_review')).toBe(false)
    expect(canChangeApplicationStatus('approved', 'rejected')).toBe(false)
    expect(canChangeApplicationStatus('withdrawn', 'withdrawn')).toBe(true)
  })

  it('sets decidedAt when a decision is made and keeps it', () => {
    const now = '2026-09-22T10:30:00.000Z'
    expect(resolveDecidedAt('in_review', null, now)).toBeNull()
    expect(resolveDecidedAt('rejected', { decidedAt: null }, now)).toBe(now)
    expect(resolveDecidedAt('rejected', { decidedAt: '2026-09-01T08:00:00.000Z' }, now)).toBe(
      '2026-09-01T08:00:00.000Z',
    )
  })
})

describe('spaces open for applications', () => {
  const today = '2026-09-22'

  it('are available and not reserved by an upcoming lease', () => {
    const space = { id: 'space-1', status: 'available' }
    expect(isSpaceOpenForApplications(space, [], today)).toBe(true)
    expect(isSpaceOpenForApplications(space, [lease({ id: 'l', endDate: '2025-12-31' })], today)).toBe(true)
    expect(isSpaceOpenForApplications(space, [lease({ id: 'l', startDate: '2026-10-01' })], today)).toBe(false)
    expect(isSpaceOpenForApplications({ ...space, status: 'occupied' }, [], today)).toBe(false)
    expect(isSpaceOpenForApplications({ ...space, status: 'maintenance' }, [], today)).toBe(false)
  })
})

describe('new applications', () => {
  const input = {
    spaceId: 'space-1',
    applicantType: 'person' as const,
    name: 'Lotta Esimerkki',
    contactPerson: null,
    email: 'lotta.esimerkki@example.com',
    phone: null,
    desiredStartDate: '2026-09-22',
    message: '',
    status: 'submitted' as const,
    tenantId: null,
  }
  const today = '2026-09-22'

  it('start today or later', () => {
    expect(checkNewApplication(input, { applications: [], today })).toEqual({})
    expect(checkNewApplication({ ...input, desiredStartDate: '2026-09-21' }, { applications: [], today })).toEqual({
      desiredStartDate: 'past',
    })
  })

  it('allow one open application per email and space, ignoring case', () => {
    const open = { spaceId: 'space-1', email: 'Lotta.Esimerkki@example.com', status: 'in_review' as const }
    expect(checkNewApplication(input, { applications: [open], today })).toEqual({ email: 'duplicate' })
    expect(checkNewApplication(input, { applications: [{ ...open, status: 'rejected' }], today })).toEqual({})
    expect(checkNewApplication(input, { applications: [{ ...open, spaceId: 'space-2' }], today })).toEqual({})
  })
})
