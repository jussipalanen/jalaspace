import { SEED_VERSION } from '../../data/seed'
import type { DemoData } from '../../types/demoData'
import type { DemoDataStore } from '../DemoDataStore'
import { LocalStorageDemoDataStore } from '../localStorage/LocalStorageDemoDataStore'
import { apiRequest } from './apiRequest'

/**
 * Demo data support for the `api` provider. The API seeds its own demo data
 * when it starts, so the browser never seeds; a reset asks the API to restore
 * its demo data and resets the browser's demo account as in localStorage mode.
 */
export class ApiDemoDataStore implements DemoDataStore {
  private readonly baseUrl: string
  private readonly browser = new LocalStorageDemoDataStore()

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  /** Always current: the API has its own seed data, so the browser never seeds it. */
  async getSeedVersion(): Promise<number | null> {
    return SEED_VERSION
  }

  /** Restores the API's demo data. `data` is not sent: the API builds the same dataset itself. */
  async replaceAll(_data: DemoData, _seedVersion: number): Promise<void> {
    await apiRequest(this.baseUrl, 'POST', '/demo/reset')
  }

  /** Resets the demo account kept in the browser (profile, profile image, password), keeping the session and language. */
  async clear(): Promise<void> {
    await this.browser.clear()
  }
}
