import type { DataLayer } from '../repositories'
import { ApiRequestError } from '../repositories/api/apiRequest'
import { EntityNotFoundError } from '../repositories/Repository'
import type { Application, ApplicationStatus } from '../types/application'
import type { IsoDate } from '../types/common'
import type { Lease } from '../types/lease'
import type { Property } from '../types/property'
import type { Space } from '../types/space'
import { toIsoDate } from '../utils/date'
import { hasErrors } from '../utils/validation'
import {
  applyApplicationStatus,
  buildNewApplication,
  canChangeApplicationStatus,
  isOpenApplication,
  isSpaceOpenForApplications,
  listOpenSpaces,
  validateApplicationForm,
  type ApplicationFormErrors,
  type ApplicationFormValues,
  type OpenSpace,
} from './applications'

type Repositories = Pick<DataLayer, 'applications' | 'spaces' | 'properties' | 'leases'>

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
}

export async function loadApplicationData(data: Repositories): Promise<ApplicationData> {
  const [applications, spaces, properties, leases] = await Promise.all([
    data.applications.getAll(),
    data.spaces.getAll(),
    data.properties.getAll(),
    data.leases.getAll(),
  ])
  return { applications, spaces, properties, leases }
}

export interface ApplicationDetails {
  application: Application
  space: Space | null
  property: Property | null
  /** An open application whose space can no longer be applied for, e.g. because it was let meanwhile. */
  spaceUnavailable: boolean
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
  return {
    application,
    space,
    property,
    spaceUnavailable:
      isOpenApplication(application) &&
      (!space || !isSpaceOpenForApplications(space, applicationData.leases, today)),
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
