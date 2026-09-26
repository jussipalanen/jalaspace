import { describe, expect, it } from 'vitest'
import type { Profile } from '../../types/profile'
import { STORAGE_KEYS } from './keys'
import { LocalStorageProfileRepository } from './LocalStorageProfileRepository'

const profile: Profile = {
  firstName: 'Esko',
  lastName: 'Esimerkki',
  birthDate: '1990-09-22',
  updatedAt: '2026-09-22T10:30:00.000Z',
}

describe('LocalStorageProfileRepository', () => {
  it('returns null before a profile is saved', async () => {
    expect(await new LocalStorageProfileRepository().get()).toBeNull()
  })

  it('saves the profile under jalaspace_profile and reads it back', async () => {
    await new LocalStorageProfileRepository().save(profile)

    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).toContain('"firstName":"Esko"')
    expect(await new LocalStorageProfileRepository().get()).toEqual(profile)
  })

  it.each([
    ['corrupt JSON', '{nope'],
    ['a wrong shape', JSON.stringify({ firstName: 'Esko' })],
  ])('treats %s as no profile', async (_, raw) => {
    window.localStorage.setItem(STORAGE_KEYS.profile, raw)
    expect(await new LocalStorageProfileRepository().get()).toBeNull()
  })
})
