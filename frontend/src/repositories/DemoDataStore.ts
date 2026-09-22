import type { DemoData } from '../types/demoData'

/** Provider-specific storage of the demo dataset, used for seeding and reset. */
export interface DemoDataStore {
  /** Version of the seed data currently stored, or `null` if never seeded. */
  getSeedVersion(): Promise<number | null>
  /** Replaces all demo collections and records the seed version. */
  replaceAll(data: DemoData, seedVersion: number): Promise<void>
  /** Removes all JalaSpace demo data but keeps the signed-in session. */
  clear(): Promise<void>
}
