import type { DemoData } from '../../types/demoData'
import type { DemoDataStore } from '../DemoDataStore'
import { STORAGE_KEY_PREFIX, STORAGE_KEYS } from './keys'
import { readJson, removeItem, writeJson } from './storage'

/** Keys that survive a demo reset: the session and user preferences. */
const PRESERVED_KEYS: ReadonlySet<string> = new Set([STORAGE_KEYS.session, STORAGE_KEYS.language])

export class LocalStorageDemoDataStore implements DemoDataStore {
  async getSeedVersion(): Promise<number | null> {
    const version = readJson(STORAGE_KEYS.seedVersion)
    return typeof version === 'number' ? version : null
  }

  async replaceAll(data: DemoData, seedVersion: number): Promise<void> {
    writeJson(STORAGE_KEYS.properties, data.properties)
    writeJson(STORAGE_KEYS.spaces, data.spaces)
    writeJson(STORAGE_KEYS.tenants, data.tenants)
    writeJson(STORAGE_KEYS.leases, data.leases)
    writeJson(STORAGE_KEYS.maintenance, data.maintenance)
    // Written last, so an interrupted seed is retried on the next visit.
    writeJson(STORAGE_KEYS.seedVersion, seedVersion)
  }

  async clear(): Promise<void> {
    const keys = Object.keys(window.localStorage).filter(
      (key) => key.startsWith(STORAGE_KEY_PREFIX) && !PRESERVED_KEYS.has(key),
    )
    keys.forEach(removeItem)
  }
}
