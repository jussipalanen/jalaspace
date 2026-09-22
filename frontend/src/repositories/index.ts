import { getDataProvider, type DataProvider } from '../config/dataProvider'
import type { DemoDataStore } from './DemoDataStore'
import { STORAGE_KEYS } from './localStorage/keys'
import { LocalStorageDemoDataStore } from './localStorage/LocalStorageDemoDataStore'
import { LocalStorageRepository } from './localStorage/LocalStorageRepository'
import { LocalStorageSessionRepository } from './localStorage/LocalStorageSessionRepository'
import type {
  LeaseRepository,
  MaintenanceRepository,
  PropertyRepository,
  SpaceRepository,
  TenantRepository,
} from './Repository'
import type { SessionRepository } from './SessionRepository'

export interface DataLayer {
  properties: PropertyRepository
  spaces: SpaceRepository
  tenants: TenantRepository
  leases: LeaseRepository
  maintenance: MaintenanceRepository
  /** Seeding and reset support; `null` for providers that manage their own data. */
  demoData: DemoDataStore | null
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
    case 'api':
      throw new Error(
        'The "api" data provider is not implemented yet. Set VITE_DATA_PROVIDER=localStorage.',
      )
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
