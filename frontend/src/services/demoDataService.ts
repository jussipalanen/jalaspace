import { createSeedData, SEED_VERSION } from '../data/seed'
import type { DemoDataStore } from '../repositories/DemoDataStore'

export type DemoDataInitResult = 'seeded' | 'existing'

/**
 * Seeds the demo data on the first visit, or when the stored seed version is
 * outdated. Existing data from the current version is never overwritten, so
 * the user's changes survive reloads.
 */
export async function initializeDemoData(
  store: DemoDataStore,
  now: Date = new Date(),
): Promise<DemoDataInitResult> {
  if ((await store.getSeedVersion()) === SEED_VERSION) return 'existing'

  await resetDemoData(store, now)
  return 'seeded'
}

/** Clears all demo data (keeping the session) and restores the seed data. */
export async function resetDemoData(store: DemoDataStore, now: Date = new Date()): Promise<void> {
  await store.clear()
  await store.replaceAll(createSeedData(now), SEED_VERSION)
}
