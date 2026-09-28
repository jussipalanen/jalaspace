import type { DataLayer } from '../repositories'
import { ApiRequestError } from '../repositories/api/apiRequest'
import { EntityNotFoundError } from '../repositories/Repository'
import type { Application, ApplicationStatus } from '../types/application'
import type { IsoDate } from '../types/common'
import type { Lease } from '../types/lease'
import type { Property } from '../types/property'
import type { Space } from '../types/space'
import type { Tenant } from '../types/tenant'
import { toIsoDate } from '../utils/date'
import { hasErrors } from '../utils/validation'
import {
  applyApplicationStatus,
  buildNewApplication,
  canChangeApplicationStatus,
  findTenantForApplication,
  isOpenApplication,
  otherOpenApplications,
  isSpaceOpenForApplications,
  listOpenSpaces,
  toTenantFormFromApplication,
  validateApplicationForm,
  type ApplicationFormErrors,
  type ApplicationFormValues,
  type OpenSpace,
} from './applications'
import { createTenant } from './tenantService'

type Repositories = Pick<DataLayer, 'applications' | 'spaces' | 'properties' | 'leases' | 'tenants'>

/** The status rules do not allow the change, e.g. because it was already decided in another tab. */
export class ApplicationStatusChangeError extends Error {
  readonly from: ApplicationStatus
  readonly to: ApplicationStatus

  constructor(from: ApplicationStatus, to: ApplicationStatus) {
    super(`Application status cannot change from ${from} to ${to}`)
    this.name = 'ApplicationStatusChangeError'
    this.from = from
    this.to = to
  }
}

export class ApplicationValidationError extends Error {
  readonly errors: ApplicationFormErrors

  constructor(errors: ApplicationFormErrors) {
    super('Invalid application')
    this.name = 'ApplicationValidationError'
    this.errors = errors
  }
}

/** The space can no longer be applied for: it was let, reserved, taken into maintenance or deleted. */
export class SpaceUnavailableError extends Error {
  constructor(spaceId: string) {
    super(`Space ${spaceId} cannot be applied for`)
    this.name = 'SpaceUnavailableError'
  }
}

export interface ApplicationData {
  applications: Application[]
  spaces: Space[]
  properties: Property[]
  leases: Lease[]
  tenants: Tenant[]
}

export async function loadApplicationData(data: Repositories): Promise<ApplicationData> {
  const [applications, spaces, properties, leases, tenants] = await Promise.all([
    data.applications.getAll(),
    data.spaces.getAll(),
    data.properties.getAll(),
    data.leases.getAll(),
    data.tenants.getAll(),
  ])
  return { applications, spaces, properties, leases, tenants }
}

export interface ApplicationDetails {
  application: Application
  space: Space | null
  property: Property | null
  /** An open application whose space can no longer be applied for, e.g. because it was let meanwhile. */
  spaceUnavailable: boolean
  /** The tenant approving would reuse (same email), or the tenant an approved application became. */
  tenant: Tenant | null
  /** An approved application's tenant already has a lease for the space. */
  hasLease: boolean
  /** Other open applications for the same space, oldest first. */
  otherOpen: Application[]
}

/** One application with its space and property; `null` if it does not exist. */
export function getApplicationDetails(
  applicationData: ApplicationData,
  id: string,
  today: IsoDate,
): ApplicationDetails | null {
  const application = applicationData.applications.find((item) => item.id === id)
  if (!application) return null
  const space = applicationData.spaces.find((item) => item.id === application.spaceId) ?? null
  const property = space ? (applicationData.properties.find((item) => item.id === space.propertyId) ?? null) : null
  const tenant =
    application.tenantId === null
      ? findTenantForApplication(application, applicationData.tenants)
      : (applicationData.tenants.find((item) => item.id === application.tenantId) ?? null)
  return {
    application,
    space,
    property,
    spaceUnavailable:
      isOpenApplication(application) &&
      (!space || !isSpaceOpenForApplications(space, applicationData.leases, today)),
    tenant,
    hasLease: applicationData.leases.some(
      (lease) => lease.tenantId === application.tenantId && lease.spaceId === application.spaceId,
    ),
    otherOpen: otherOpenApplications(application, applicationData.applications),
  }
}

/** Changes the status after re-checking the rules with the stored application. */
export async function changeApplicationStatus(
  data: Repositories,
  id: string,
  status: ApplicationStatus,
  now: Date = new Date(),
): Promise<Application> {
  const existing = await data.applications.getById(id)
  if (!existing) throw new EntityNotFoundError(id)
  if (!canChangeApplicationStatus(existing.status, status)) {
    throw new ApplicationStatusChangeError(existing.status, status)
  }
  return data.applications.update(applyApplicationStatus(existing, status, now.toISOString()))
}

/** Nothing refers to an application, so it can always be deleted. */
export async function deleteApplication(data: Repositories, id: string): Promise<void> {
  await data.applications.delete(id)
}

type PublicRepositories = Pick<DataLayer, 'spaces' | 'properties' | 'leases'>

/** The spaces anyone can apply for, for the public pages. */
export async function loadOpenSpaces(
  data: PublicRepositories,
  locale: string,
  now: Date = new Date(),
): Promise<OpenSpace[]> {
  const [spaces, properties, leases] = await Promise.all([
    data.spaces.getAll(),
    data.properties.getAll(),
    data.leases.getAll(),
  ])
  return listOpenSpaces(spaces, properties, leases, toIsoDate(now), locale)
}

/** Maps the API's answers to the same errors as the checks made here. */
function fromApiError(error: unknown, spaceId: string): unknown {
  if (!(error instanceof ApiRequestError)) return error
  if (error.code === 'space_unavailable') return new SpaceUnavailableError(spaceId)
  const fields = error.details.fields as Record<string, string> | undefined
  if (error.code === 'validation_failed' && fields) return new ApplicationValidationError(fields as ApplicationFormErrors)
  return error
}

/**
 * Sends a new application after checking it, and the space, with the current
 * data: the space may have been let or reserved while the form was open.
 */
export async function createApplication(
  data: Pick<DataLayer, 'applications' | 'spaces' | 'leases'>,
  spaceId: string,
  values: ApplicationFormValues,
  now: Date = new Date(),
): Promise<Application> {
  const today = toIsoDate(now)
  const [space, leases, applications] = await Promise.all([
    data.spaces.getById(spaceId),
    data.leases.getAll(),
    data.applications.getAll(),
  ])
  const errors = validateApplicationForm(values, { spaceId, today, applications })
  if (hasErrors(errors)) throw new ApplicationValidationError(errors)
  if (!space || !isSpaceOpenForApplications(space, leases, today)) throw new SpaceUnavailableError(spaceId)

  try {
    return await data.applications.create(buildNewApplication(values, spaceId, now.toISOString()))
  } catch (error) {
    throw fromApiError(error, spaceId)
  }
}

export interface ApprovalResult {
  application: Application
  tenant: Tenant
  /** `false` when a tenant with the applicant's email already existed and was reused. */
  tenantCreated: boolean
}

/**
 * Approves an application: reuses the tenant with the applicant's email, or
 * creates one from the applicant's details, then marks the application
 * approved with that tenant. No lease is created; the caller opens the lease
 * form. The rules are checked again with current data. If saving the
 * application fails after the tenant was created, approving again finds that
 * tenant by email, so no duplicate is created.
 */
export async function approveApplication(
  data: Repositories,
  id: string,
  now: Date = new Date(),
): Promise<ApprovalResult> {
  const [existing, leases, tenants] = await Promise.all([
    data.applications.getById(id),
    data.leases.getAll(),
    data.tenants.getAll(),
  ])
  if (!existing) throw new EntityNotFoundError(id)
  if (!canChangeApplicationStatus(existing.status, 'approved')) {
    throw new ApplicationStatusChangeError(existing.status, 'approved')
  }
  const space = await data.spaces.getById(existing.spaceId)
  if (!space || !isSpaceOpenForApplications(space, leases, toIsoDate(now))) {
    throw new SpaceUnavailableError(existing.spaceId)
  }

  const found = findTenantForApplication(existing, tenants)
  const tenant = found ?? (await createTenant(data, toTenantFormFromApplication(existing), now))
  const application = await data.applications.update({
    ...applyApplicationStatus(existing, 'approved', now.toISOString()),
    tenantId: tenant.id,
  })
  return { application, tenant, tenantCreated: found === null }
}

/**
 * Rejects the given open applications one by one, e.g. the others for a space
 * after one was approved. Applications that were decided meanwhile are skipped.
 * Returns how many were rejected.
 */
export async function rejectApplications(
  data: Repositories,
  ids: string[],
  now: Date = new Date(),
): Promise<number> {
  let rejected = 0
  for (const id of ids) {
    try {
      await changeApplicationStatus(data, id, 'rejected', now)
      rejected++
    } catch (error) {
      if (!(error instanceof ApplicationStatusChangeError)) throw error
    }
  }
  return rejected
}

/** The lease form for an approved application: its tenant, space and desired start already filled in. */
export function leaseFormPath(application: Pick<Application, 'id' | 'tenantId' | 'spaceId' | 'desiredStartDate'>): string {
  const params = new URLSearchParams({
    tenant: application.tenantId ?? '',
    space: application.spaceId,
    startDate: application.desiredStartDate,
    returnTo: `/applications/${application.id}`,
  })
  return `/leases/new?${params}`
}
