import type { DataLayer } from '../repositories'
import { EntityNotFoundError } from '../repositories/Repository'
import type { Application, ApplicationStatus } from '../types/application'
import type { IsoDate } from '../types/common'
import type { Lease } from '../types/lease'
import type { Property } from '../types/property'
import type { Space } from '../types/space'
import {
  applyApplicationStatus,
  canChangeApplicationStatus,
  isOpenApplication,
  isSpaceOpenForApplications,
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
