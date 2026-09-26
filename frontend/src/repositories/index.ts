import { getApiUrl } from '../config/api'
import { getDataProvider, type DataProvider } from '../config/dataProvider'
import { ApiDemoDataStore } from './api/ApiDemoDataStore'
import { ApiRepository } from './api/ApiRepository'
import type { DemoDataStore } from './DemoDataStore'
import { STORAGE_KEYS } from './localStorage/keys'
import { LocalStorageDemoDataStore } from './localStorage/LocalStorageDemoDataStore'
import { LocalStorageRepository } from './localStorage/LocalStorageRepository'
import { LocalStorageProfileRepository } from './localStorage/LocalStorageProfileRepository'
import { LocalStorageSessionRepository } from './localStorage/LocalStorageSessionRepository'
import type { ProfileRepository } from './ProfileRepository'
import type {
  LeaseRepository,
  MaintenanceRepository,
  PropertyRepository,
  SpaceRepository,
  TenantRepository,
} from './Repository'
import type { SessionRepository } from './SessionRepository'
import type { Entity } from '../types/common'
import { DEFAULT_MAP_ZOOM, isMapZoom } from '../services/location'
import type { Property } from '../types/property'
import type { Space } from '../types/space'

export interface DataLayer {
  properties: PropertyRepository
  spaces: SpaceRepository
  tenants: TenantRepository
  leases: LeaseRepository
  maintenance: MaintenanceRepository
  /** Seeding and reset support; `null` for providers that manage their own data. */
  demoData: DemoDataStore | null
}

/** Spaces from an API version before rooms and features were added have none. */
function withSpaceDefaults(entity: Entity): Space {
  const space = entity as Space
  return { ...space, rooms: space.rooms ?? null, features: Array.isArray(space.features) ? space.features : [] }
}

/** Properties from an API version before locations (or their zoom levels) were added have none. */
function withPropertyDefaults(entity: Entity): Property {
  const property = entity as Property
  const location = property.location ?? null
  return {
    ...property,
    location: location && { ...location, zoom: isMapZoom(location.zoom) ? location.zoom : DEFAULT_MAP_ZOOM },
  }
}

/** Single place that maps a data provider to its repository implementations. */
export function createDataLayer(provider: DataProvider): DataLayer {
  switch (provider) {
    case 'localStorage':
      return {
        properties: new LocalStorageRepository(STORAGE_KEYS.properties),
        spaces: new LocalStorageRepository(STORAGE_KEYS.spaces),
        tenants: new LocalStorageRepository(STORAGE_KEYS.tenants),
        leases: new LocalStorageRepository(STORAGE_KEYS.leases),
        maintenance: new LocalStorageRepository(STORAGE_KEYS.maintenance),
        demoData: new LocalStorageDemoDataStore(),
      }
    case 'api': {
      const apiUrl = getApiUrl()
      if (!apiUrl) {
        throw new Error('The "api" data provider needs VITE_API_URL, e.g. http://localhost:3000.')
      }
      return {
        properties: new ApiRepository(apiUrl, '/properties', withPropertyDefaults),
        // The API serves spaces under the app route's name.
        spaces: new ApiRepository(apiUrl, '/units', withSpaceDefaults),
        tenants: new ApiRepository(apiUrl, '/tenants'),
        leases: new ApiRepository(apiUrl, '/leases'),
        maintenance: new ApiRepository(apiUrl, '/maintenance'),
        demoData: new ApiDemoDataStore(apiUrl),
      }
    }
  }
}

let dataLayer: DataLayer | null = null

/**
 * Returns the data layer for the configured provider. Created lazily so a
 * configuration error surfaces where it can be handled, not at import time.
 */
export function getDataLayer(): DataLayer {
  dataLayer ??= createDataLayer(getDataProvider())
  return dataLayer
}

export const sessionRepository: SessionRepository = new LocalStorageSessionRepository()

// Like the session, the profile belongs to the signed-in user rather than the data provider.
export const profileRepository: ProfileRepository = new LocalStorageProfileRepository()
