import { describe, expect, it } from 'vitest'
import { createSeedData, SEED_VERSION } from '../data/seed'
import { STORAGE_KEYS } from '../repositories/localStorage/keys'
import { LocalStorageDemoDataStore } from '../repositories/localStorage/LocalStorageDemoDataStore'
import { LocalStorageRepository } from '../repositories/localStorage/LocalStorageRepository'
import type { Property } from '../types/property'
import { initializeDemoData, resetDemoData } from './demoDataService'

const now = new Date('2026-09-22T10:30:00.000Z')
const properties = () => new LocalStorageRepository<Property>(STORAGE_KEYS.properties)

describe('demo data', () => {
  it('seeds the data on the first visit', async () => {
    const result = await initializeDemoData(new LocalStorageDemoDataStore(), now)

    expect(result).toBe('seeded')
    expect(await properties().getAll()).toEqual(createSeedData(now).properties)
    expect(window.localStorage.getItem(STORAGE_KEYS.seedVersion)).toBe(String(SEED_VERSION))
  })

  it('keeps the user’s changes on later visits', async () => {
    const store = new LocalStorageDemoDataStore()
    await initializeDemoData(store, now)
    const [first] = await properties().getAll()
    await properties().update({ ...first!, name: 'Renamed by user' })

    const result = await initializeDemoData(store, now)

    expect(result).toBe('existing')
    expect((await properties().getById(first!.id))?.name).toBe('Renamed by user')
  })

  it('re-seeds when the stored seed version is outdated', async () => {
    window.localStorage.setItem(STORAGE_KEYS.seedVersion, JSON.stringify(SEED_VERSION - 1))
    window.localStorage.setItem(STORAGE_KEYS.properties, JSON.stringify([]))

    expect(await initializeDemoData(new LocalStorageDemoDataStore(), now)).toBe('seeded')
    expect(await properties().getAll()).toHaveLength(4)
  })

  it('reset keeps the language preference', async () => {
    const store = new LocalStorageDemoDataStore()
    await initializeDemoData(store, now)
    window.localStorage.setItem(STORAGE_KEYS.language, '"fi"')

    await resetDemoData(store, now)

    expect(window.localStorage.getItem(STORAGE_KEYS.language)).toBe('"fi"')
  })

  it('reset restores the seed data and keeps the session', async () => {
    const store = new LocalStorageDemoDataStore()
    await initializeDemoData(store, now)
    const [first] = await properties().getAll()
    await properties().delete(first!.id)
    window.localStorage.setItem(STORAGE_KEYS.session, '{"signed":"in"}')
    window.localStorage.setItem('jalaspace_future_setting', 'x')
    window.localStorage.setItem('other_app_key', 'keep me')

    await resetDemoData(store, now)

    expect(await properties().getAll()).toEqual(createSeedData(now).properties)
    expect(window.localStorage.getItem(STORAGE_KEYS.session)).toBe('{"signed":"in"}')
    expect(window.localStorage.getItem('jalaspace_future_setting')).toBeNull()
    expect(window.localStorage.getItem('other_app_key')).toBe('keep me')
  })
})
